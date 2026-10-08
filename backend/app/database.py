"""Database connections: Turso (libSQL) when configured, a local SQLite file otherwise.

``connect(settings)`` picks the backend from the environment:

* ``TURSO_DATABASE_URL`` (+ ``TURSO_AUTH_TOKEN``) set → Turso via the ``libsql`` client
* otherwise → the local SQLite file at ``DATABASE_PATH`` (stdlib ``sqlite3``)

Both return the same small sqlite3-style surface the services were written
against, so no query had to change for Turso:

* ``conn.execute(sql, params)`` → cursor with ``fetchone`` / ``fetchall`` /
  iteration / ``lastrowid``, plus ``executemany``, ``executescript``, ``close``
* rows support ``row["column"]``, ``row[0]`` and ``dict(row)`` like ``sqlite3.Row``
* ``?`` and ``:named`` placeholders

Connections run in autocommit mode and every write path opts into an explicit
``transaction()``; ``BEGIN IMMEDIATE`` takes the write lock up front.
"""

import re
import sqlite3
import threading
from collections.abc import Iterable, Iterator, Mapping, Sequence
from contextlib import contextmanager
from pathlib import Path
from typing import Any

from app.config import Settings

SCHEMA_PATH = Path(__file__).with_name("schema.sql")


# --- Local SQLite --------------------------------------------------------------


def _connect_sqlite(path: Path) -> sqlite3.Connection:
    path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(path, isolation_level=None, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    conn.execute("PRAGMA busy_timeout = 5000")
    return conn


# --- Turso / libSQL ------------------------------------------------------------

# String literals, quoted identifiers and comments (left untouched), or a :name placeholder.
_SQL_TOKENS = re.compile(r"""'(?:[^']|'')*'|"(?:[^"]|"")*"|--[^\n]*|/\*.*?\*/|:([A-Za-z_]\w*)""", re.DOTALL)

# A single-row INSERT whose values are all `?`, e.g. INSERT INTO t (a, b) VALUES (?, ?)
_SIMPLE_INSERT = re.compile(
    r"^\s*(INSERT\s+INTO\s+\w+\s*\([^)]*\)\s*VALUES\s*)(\(\s*\?(?:\s*,\s*\?)*\s*\))\s*;?\s*$",
    re.IGNORECASE,
)
# SQLite's most conservative limit on bound parameters per statement.
_MAX_PARAMS_PER_STATEMENT = 999


def _bind(sql: str, params: Sequence[Any] | Mapping[str, Any]) -> tuple[str, tuple[Any, ...]]:
    """Turn :named placeholders into positional ones — the libSQL client only binds sequences."""
    if not isinstance(params, Mapping):
        return sql, tuple(params)
    values: list[Any] = []

    def to_positional(match: re.Match[str]) -> str:
        name = match.group(1)
        if name is None:
            return match.group(0)
        if name not in params:
            raise ValueError(f"No value supplied for SQL parameter :{name}")
        values.append(params[name])
        return "?"

    return _SQL_TOKENS.sub(to_positional, sql), tuple(values)


class Row:
    """``sqlite3.Row`` look-alike: index by position or (case-insensitive) column name."""

    __slots__ = ("_names", "_index", "_values")

    def __init__(self, names: tuple[str, ...], index: dict[str, int], values: Sequence[Any]):
        self._names = names
        self._index = index
        self._values = tuple(values)

    def __getitem__(self, key: int | str | slice) -> Any:
        if isinstance(key, str):
            return self._values[self._index[key.lower()]]
        return self._values[key]

    def keys(self) -> list[str]:
        return list(self._names)

    def __iter__(self) -> Iterator[Any]:
        return iter(self._values)

    def __len__(self) -> int:
        return len(self._values)

    def __repr__(self) -> str:
        return f"Row({dict(zip(self._names, self._values))!r})"


class Cursor:
    """Wraps a libSQL cursor so results come back as ``Row`` objects."""

    def __init__(self, raw: Any):
        self._raw = raw
        self._columns: tuple[tuple[str, ...], dict[str, int]] | None = None

    @property
    def lastrowid(self) -> int | None:
        return self._raw.lastrowid

    @property
    def rowcount(self) -> int:
        return self._raw.rowcount

    def _row(self, values: Sequence[Any]) -> Row:
        if self._columns is None:
            names = tuple(column[0] for column in self._raw.description or ())
            index: dict[str, int] = {}
            for position, name in enumerate(names):
                index.setdefault(name.lower(), position)  # first match wins, as in sqlite3
            self._columns = (names, index)
        return Row(*self._columns, values)

    def fetchone(self) -> Row | None:
        values = self._raw.fetchone()
        return None if values is None else self._row(values)

    def fetchall(self) -> list[Row]:
        return [self._row(values) for values in self._raw.fetchall()]

    def __iter__(self) -> Iterator[Row]:
        return iter(self.fetchall())


class LibsqlConnection:
    """A libSQL connection with the sqlite3 behaviour the services rely on."""

    def __init__(self, raw: Any):
        self._raw = raw

    def execute(self, sql: str, params: Sequence[Any] | Mapping[str, Any] = ()) -> Cursor:
        statement, values = _bind(sql, params)
        return Cursor(self._raw.execute(statement, values))

    def executemany(self, sql: str, seq_of_params: Iterable[Sequence[Any] | Mapping[str, Any]]) -> None:
        bound = [_bind(sql, params) for params in seq_of_params]
        if not bound:
            return
        insert = _SIMPLE_INSERT.match(bound[0][0])
        if insert is None:
            for statement, values in bound:
                self._raw.execute(statement, values)
            return
        # Each statement is a network round trip, so send rows as multi-row INSERTs.
        prefix, row_placeholders = insert.groups()
        rows_per_statement = max(1, _MAX_PARAMS_PER_STATEMENT // row_placeholders.count("?"))
        for start in range(0, len(bound), rows_per_statement):
            chunk = bound[start : start + rows_per_statement]
            statement = prefix + ", ".join([row_placeholders] * len(chunk))
            self._raw.execute(statement, tuple(value for _, values in chunk for value in values))

    def executescript(self, script: str) -> None:
        self._raw.executescript(script)

    def close(self) -> None:
        self._raw.close()


def _connect_turso(url: str, auth_token: str | None) -> LibsqlConnection:
    import libsql  # only needed when Turso is configured

    # libSQL enforces foreign keys by default (it is built with SQLITE_DEFAULT_FOREIGN_KEYS=1);
    # per-connection PRAGMAs such as busy_timeout don't apply to a remote connection.
    return LibsqlConnection(libsql.connect(url, auth_token=auth_token or "", isolation_level=None))


# --- Public API ----------------------------------------------------------------

Connection = sqlite3.Connection | LibsqlConnection


def connect(settings: Settings) -> Connection:
    if settings.uses_turso:
        return _connect_turso(settings.turso_database_url, settings.turso_auth_token)
    return _connect_sqlite(settings.database_path)


def describe_database(settings: Settings) -> str:
    if settings.uses_turso:
        return f"Turso ({settings.turso_database_url})"
    return f"local SQLite ({settings.database_path})"


# One write transaction at a time per process. SQLite only allows one writer anyway;
# for libSQL it also prevents a stall: the client handles one call at a time per
# process, so a request waiting in BEGIN would keep the request that holds the write
# lock from reaching COMMIT until the server timed its transaction out.
_write_lock = threading.RLock()


@contextmanager
def transaction(conn: Connection) -> Iterator[Connection]:
    with _write_lock:
        conn.execute("BEGIN IMMEDIATE")
        try:
            yield conn
            conn.execute("COMMIT")
        except BaseException:
            _rollback_quietly(conn)
            raise


def _rollback_quietly(conn: Connection) -> None:
    """Roll back without masking the original error (the server may have already aborted)."""
    try:
        conn.execute("ROLLBACK")
    except Exception:
        pass


def init_schema(conn: Connection) -> None:
    """Create any missing tables and indexes (every statement is IF NOT EXISTS)."""
    if isinstance(conn, sqlite3.Connection):
        conn.execute("PRAGMA journal_mode = WAL")  # Turso manages journaling server-side
    conn.executescript(SCHEMA_PATH.read_text(encoding="utf-8"))


def is_seeded(conn: Connection) -> bool:
    return conn.execute("SELECT EXISTS (SELECT 1 FROM courses)").fetchone()[0] == 1
