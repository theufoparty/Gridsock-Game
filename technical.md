# CSS / SASS

## Syntax

1. Skriv class namn med bindestreck som avdelare ex. 'this-is-a-class'
2. Inga förkortningar

## Arbetsstruktur

1. Nestlad CSS
2. Använda sig av gap istället av margin så mycket det går
3. Variabler för färger
4. Ev mixins för återanvändbar funktionalitet

## Sass Partials

1. Variabler / mixins partials

   - Path: `src/styles/variables/_variables.scss`
   - Path: `src/styles/variables/_mixins.scss`

2. Layout partials

   - Path: `src/styles/layout/_mobile.scss`
     ....

3. Vendor Reset partial

   - Path: `src/styles/vendor/_reset.scss`

# Debug funktion

- Lägga en färg för att se divs i utvecklingsstadie / true från början

- $debugging: true;

div {
@if $debugging {
outline: 1px solid hotpink
}
}

# TS

## Syntax

1. Skriv camelCase
2. Inga förkortningar ex. (ej btn, skriv button)
3. QuerySelectors för ids, inte klasser

## Funktion syntax / funktionalitet

1. Använda Function syntax
2. Returnera tidigt ifall något ej finns ex, undviker för nestlad kod - guard claus

Ex:

if (element === null) {
return;
}

3. Undvika så mycket som möjligt anonyma funktioner
4. Lokala funktioner helst d.v.s. ha parametrar och argument
5. Inte vara rädd för långa funktionsnamn
6. Om möjligt kortare funktioner som gör endast en sak - helst max 20 rader
7. Ifall funktioner kan slås ihop till generiska funktioner gör detta

## Request funktioner till servern

1. Returnera jsonData i requests, återanvända i andra funktioner
2. Använda then

## Event lyssnare

1. Gärna event delegering för event lyssnare, sparar antalet querySelectorer, överlag bäst metod.
2. Rätt eventlyssnare, t.ex. 'input' istället för 'change' på inputs.

## Beskrivande funktionsprefixer

- returnerande funktioner // prefix: `get`
- togglande funktioner // prefix: `toggle`
- boolean funktioner // prefix: `is`
- funktioner som ändrar t.ex. attribut // prefix: `set`
- initiala funktioner // prefix: `initial`
- saker som visar saker för användaren // `display`

## Funktioners dokumentation

1. Dokumentara svårare funktioner med pseudokod ovanför / ej för beskrivande funktioner.

- Funktion övergripande beskrivning
- @param {string} parameter namn
- @returns beskrivning
  \*/
  function myFunc() {
  console.log('Kom och hjälp mig!')
  };

2. Kommentarer som förklarar svårare icke-beskrivande stycken i koden. / inte för mycket dock!

## Struktur i main.ts

1. importer längst upp
2. const globala selektorer
3. let variabler
4. Indela funktioner på rätt plats / logiskt
5. Event lyssnare längst ner

## Servern

1. Använda then för promises
2. Tydliga felmeddelanden med rätt statuskoder t.ex 401 för not authorized etc.

## Egen types fil

- För större interfaces som exporteras in i main, där I är prefixet.
  - Path: `src/assets/utils/types.ts`

## Helperfunctions

- Helperfunction.ts för hjälpfunktioner - mer generiska funktioner som exporteras.
  - Path: `src/assets/utils/helperfunctions.ts`

## Ikoner / bilder

- Path: `src/assets/icons - images`
