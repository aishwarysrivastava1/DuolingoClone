"""Seed course: Spanish for English speakers.

Each skill is authored as vocabulary, sentences and fill-in-the-blank items;
`app.seed.lessons` turns that material into lessons with every exercise type.
"""

from dataclasses import dataclass, field


@dataclass(frozen=True)
class Word:
    es: str
    en: str
    emoji: str


@dataclass(frozen=True)
class Sentence:
    es: str
    en: str
    en_alternatives: tuple[str, ...] = ()
    es_alternatives: tuple[str, ...] = ()


@dataclass(frozen=True)
class Blank:
    es: str  # contains '___'
    answer: str
    distractors: tuple[str, str]
    en: str


@dataclass(frozen=True)
class SkillContent:
    title: str
    icon: str
    words: tuple[Word, ...]  # 6 words
    sentences: tuple[Sentence, ...]  # 6 sentences
    blanks: tuple[Blank, ...]  # 3 blanks, one per lesson


@dataclass(frozen=True)
class UnitContent:
    title: str
    description: str
    theme: str
    skills: tuple[SkillContent, ...]


@dataclass(frozen=True)
class CourseContent:
    code: str
    title: str
    learning_language: str
    from_language: str
    units: tuple[UnitContent, ...] = field(default_factory=tuple)


GREETINGS = SkillContent(
    title="Greetings",
    icon="👋",
    words=(
        Word("hola", "hello", "👋"),
        Word("gracias", "thank you", "🙏"),
        Word("buenos días", "good morning", "🌅"),
        Word("buenas noches", "good night", "🌙"),
        Word("sí", "yes", "✅"),
        Word("no", "no", "❌"),
    ),
    sentences=(
        Sentence("Hola, Ana.", "Hello, Ana.", ("Hi, Ana.",)),
        Sentence("Buenos días, señor.", "Good morning, sir.", ("Good morning, mister.",)),
        Sentence("Gracias, adiós.", "Thank you, goodbye.", ("Thanks, goodbye.", "Thank you, bye.", "Thanks, bye.")),
        Sentence("Buenas noches, Juan.", "Good night, Juan.", ("Good evening, Juan.",)),
        Sentence("Sí, por favor.", "Yes, please."),
        Sentence("No, gracias.", "No, thank you.", ("No, thanks.",)),
    ),
    blanks=(
        Blank("___ días, Ana.", "Buenos", ("Buenas", "Hola"), "Good morning, Ana."),
        Blank("Buenas ___, Juan.", "noches", ("días", "gracias"), "Good night, Juan."),
        Blank("No, ___.", "gracias", ("hola", "noches"), "No, thank you."),
    ),
)

PEOPLE = SkillContent(
    title="People",
    icon="🧑",
    words=(
        Word("el hombre", "the man", "👨"),
        Word("la mujer", "the woman", "👩"),
        Word("el niño", "the boy", "👦"),
        Word("la niña", "the girl", "👧"),
        Word("el bebé", "the baby", "👶"),
        Word("la doctora", "the doctor", "👩‍⚕️"),
    ),
    sentences=(
        Sentence("Soy un niño.", "I am a boy.", ("I'm a boy.",), ("Yo soy un niño.",)),
        Sentence("Ella es una mujer.", "She is a woman.", ("She's a woman.",)),
        Sentence("El hombre es alto.", "The man is tall."),
        Sentence("La niña es mi amiga.", "The girl is my friend."),
        Sentence("Él es un bebé.", "He is a baby.", ("He's a baby.",)),
        Sentence("Yo soy la doctora.", "I am the doctor.", ("I'm the doctor.",), ("Soy la doctora.",)),
    ),
    blanks=(
        Blank("Yo ___ un niño.", "soy", ("es", "eres"), "I am a boy."),
        Blank("Ella es una ___.", "mujer", ("hombre", "niño"), "She is a woman."),
        Blank("___ hombre es alto.", "El", ("La", "Una"), "The man is tall."),
    ),
)

CAFE = SkillContent(
    title="At the café",
    icon="☕",
    words=(
        Word("el café", "the coffee", "☕"),
        Word("el agua", "the water", "💧"),
        Word("el pan", "the bread", "🍞"),
        Word("la leche", "the milk", "🥛"),
        Word("la manzana", "the apple", "🍎"),
        Word("el té", "the tea", "🍵"),
    ),
    sentences=(
        Sentence("Yo bebo agua.", "I drink water.", ("I am drinking water.", "I'm drinking water."), ("Bebo agua.",)),
        Sentence("Un café, por favor.", "A coffee, please.", ("One coffee, please.",)),
        Sentence("Ella come pan.", "She eats bread.", ("She is eating bread.", "She's eating bread.")),
        Sentence("El niño bebe leche.", "The boy drinks milk.", ("The boy is drinking milk.",)),
        Sentence("Como una manzana.", "I eat an apple.", ("I am eating an apple.", "I'm eating an apple."), ("Yo como una manzana.",)),
        Sentence("El té está caliente.", "The tea is hot."),
    ),
    blanks=(
        Blank("Yo ___ agua.", "bebo", ("bebes", "come"), "I drink water."),
        Blank("Ella come ___.", "pan", ("agua", "té"), "She eats bread."),
        Blank("Un ___, por favor.", "café", ("leche", "manzana"), "A coffee, please."),
    ),
)

FAMILY = SkillContent(
    title="Family",
    icon="👪",
    words=(
        Word("la madre", "the mother", "👩"),
        Word("el padre", "the father", "👨"),
        Word("el hermano", "the brother", "👦"),
        Word("la hermana", "the sister", "👧"),
        Word("el abuelo", "the grandfather", "👴"),
        Word("la abuela", "the grandmother", "👵"),
    ),
    sentences=(
        Sentence("Mi madre es alta.", "My mother is tall.", ("My mom is tall.",)),
        Sentence("Él es mi padre.", "He is my father.", ("He's my father.", "He is my dad.")),
        Sentence("Tengo un hermano.", "I have a brother.", (), ("Yo tengo un hermano.",)),
        Sentence("Mi hermana come pan.", "My sister eats bread.", ("My sister is eating bread.",)),
        Sentence("La abuela bebe té.", "The grandmother drinks tea.", ("The grandmother is drinking tea.", "Grandma drinks tea.")),
        Sentence("Mi abuelo es simpático.", "My grandfather is nice.", ("My grandfather is friendly.", "My grandpa is nice.")),
    ),
    blanks=(
        Blank("___ madre es alta.", "Mi", ("Yo", "El"), "My mother is tall."),
        Blank("Tengo una ___.", "hermana", ("hermano", "padre"), "I have a sister."),
        Blank("Él es mi ___.", "abuelo", ("abuela", "madre"), "He is my grandfather."),
    ),
)

ANIMALS = SkillContent(
    title="Animals",
    icon="🐶",
    words=(
        Word("el perro", "the dog", "🐶"),
        Word("el gato", "the cat", "🐱"),
        Word("el caballo", "the horse", "🐴"),
        Word("el pájaro", "the bird", "🐦"),
        Word("el pez", "the fish", "🐟"),
        Word("la vaca", "the cow", "🐮"),
    ),
    sentences=(
        Sentence("El perro come.", "The dog eats.", ("The dog is eating.",)),
        Sentence("Tengo un gato.", "I have a cat.", (), ("Yo tengo un gato.",)),
        Sentence("El caballo es grande.", "The horse is big.", ("The horse is large.",)),
        Sentence("El pájaro bebe agua.", "The bird drinks water.", ("The bird is drinking water.",)),
        Sentence("Mi pez es pequeño.", "My fish is small.", ("My fish is little.",)),
        Sentence("Las vacas comen.", "The cows eat.", ("The cows are eating.",)),
    ),
    blanks=(
        Blank("Tengo un ___.", "gato", ("vaca", "leche"), "I have a cat."),
        Blank("El caballo es ___.", "grande", ("agua", "perro"), "The horse is big."),
        Blank("El ___ bebe agua.", "pájaro", ("vaca", "manzana"), "The bird drinks water."),
    ),
)

COLORS = SkillContent(
    title="Colors",
    icon="🎨",
    words=(
        Word("rojo", "red", "🔴"),
        Word("azul", "blue", "🔵"),
        Word("verde", "green", "🟢"),
        Word("amarillo", "yellow", "🟡"),
        Word("negro", "black", "⚫"),
        Word("blanco", "white", "⚪"),
    ),
    sentences=(
        Sentence("El gato es negro.", "The cat is black."),
        Sentence("La manzana es roja.", "The apple is red."),
        Sentence("El perro es blanco.", "The dog is white."),
        Sentence("Mi coche es azul.", "My car is blue."),
        Sentence("La hoja es verde.", "The leaf is green."),
        Sentence("El sol es amarillo.", "The sun is yellow."),
    ),
    blanks=(
        Blank("La manzana es ___.", "roja", ("rojo", "azules"), "The apple is red."),
        Blank("El gato es ___.", "negro", ("negra", "verdes"), "The cat is black."),
        Blank("El sol es ___.", "amarillo", ("amarilla", "azules"), "The sun is yellow."),
    ),
)

PLACES = SkillContent(
    title="Places",
    icon="🏠",
    words=(
        Word("la casa", "the house", "🏠"),
        Word("la escuela", "the school", "🏫"),
        Word("el hospital", "the hospital", "🏥"),
        Word("el parque", "the park", "🌳"),
        Word("la playa", "the beach", "🏖️"),
        Word("el hotel", "the hotel", "🏨"),
    ),
    sentences=(
        Sentence("Estoy en casa.", "I am at home.", ("I'm at home.", "I am home.", "I'm home."), ("Yo estoy en casa.",)),
        Sentence("La escuela es grande.", "The school is big.", ("The school is large.",)),
        Sentence("¿Dónde está el hospital?", "Where is the hospital?", ("Where's the hospital?",)),
        Sentence("Vamos al parque.", "We go to the park.", ("We are going to the park.", "We're going to the park.", "Let's go to the park.")),
        Sentence("El hotel está cerca.", "The hotel is near.", ("The hotel is close.", "The hotel is nearby.")),
        Sentence("La playa es bonita.", "The beach is pretty.", ("The beach is beautiful.", "The beach is nice.")),
    ),
    blanks=(
        Blank("Estoy en ___.", "casa", ("playas", "hoteles"), "I am at home."),
        Blank("¿Dónde está el ___?", "hospital", ("escuela", "playa"), "Where is the hospital?"),
        Blank("La playa es ___.", "bonita", ("bonito", "grandes"), "The beach is pretty."),
    ),
)

TRANSPORT = SkillContent(
    title="Transport",
    icon="🚆",
    words=(
        Word("el tren", "the train", "🚆"),
        Word("el avión", "the plane", "✈️"),
        Word("el coche", "the car", "🚗"),
        Word("el autobús", "the bus", "🚌"),
        Word("el barco", "the boat", "🚢"),
        Word("la bicicleta", "the bicycle", "🚲"),
    ),
    sentences=(
        Sentence("El tren es rápido.", "The train is fast.", ("The train is quick.",)),
        Sentence("Tomo el autobús.", "I take the bus.", ("I am taking the bus.", "I'm taking the bus."), ("Yo tomo el autobús.",)),
        Sentence("El avión es grande.", "The plane is big.", ("The airplane is big.", "The plane is large.")),
        Sentence("Mi coche es rojo.", "My car is red."),
        Sentence("El barco está en el agua.", "The boat is in the water.", ("The ship is in the water.",)),
        Sentence("Voy en bicicleta.", "I go by bike.", ("I go by bicycle.", "I'm going by bike.", "I ride a bike."), ("Yo voy en bicicleta.",)),
    ),
    blanks=(
        Blank("Tomo el ___.", "autobús", ("bicicleta", "casa"), "I take the bus."),
        Blank("El tren es ___.", "rápido", ("rápida", "rápidos"), "The train is fast."),
        Blank("Voy en ___.", "bicicleta", ("agua", "hotel"), "I go by bike."),
    ),
)

NUMBERS = SkillContent(
    title="Numbers",
    icon="🔢",
    words=(
        Word("uno", "one", "1️⃣"),
        Word("dos", "two", "2️⃣"),
        Word("tres", "three", "3️⃣"),
        Word("cuatro", "four", "4️⃣"),
        Word("cinco", "five", "5️⃣"),
        Word("diez", "ten", "🔟"),
    ),
    sentences=(
        Sentence("Tengo dos gatos.", "I have two cats.", (), ("Yo tengo dos gatos.",)),
        Sentence("Un café y dos tés.", "A coffee and two teas.", ("One coffee and two teas.",)),
        Sentence("Hay tres perros.", "There are three dogs."),
        Sentence("Ella tiene cuatro hermanos.", "She has four brothers.", ("She has four siblings.",)),
        Sentence("Son las cinco.", "It is five o'clock.", ("It's five o'clock.", "It is five.", "It's five.")),
        Sentence("Tengo diez manzanas.", "I have ten apples.", (), ("Yo tengo diez manzanas.",)),
    ),
    blanks=(
        Blank("Tengo ___ gatos.", "dos", ("uno", "un"), "I have two cats."),
        Blank("Hay ___ perros.", "tres", ("una", "un"), "There are three dogs."),
        Blank("Tengo ___ manzanas.", "diez", ("un", "una"), "I have ten apples."),
    ),
)

SPANISH = CourseContent(
    code="es-en",
    title="Spanish",
    learning_language="es",
    from_language="en",
    units=(
        UnitContent(
            title="Form basic sentences",
            description="Greet people, introduce yourself and order at a café",
            theme="green",
            skills=(GREETINGS, PEOPLE, CAFE),
        ),
        UnitContent(
            title="Talk about family and pets",
            description="Describe your family, animals and colors",
            theme="purple",
            skills=(FAMILY, ANIMALS, COLORS),
        ),
        UnitContent(
            title="Get around town",
            description="Name places, use transport and count",
            theme="blue",
            skills=(PLACES, TRANSPORT, NUMBERS),
        ),
    ),
)
