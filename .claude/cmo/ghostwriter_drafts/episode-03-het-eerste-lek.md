---
serie: Het Aintern Experiment
episode: 3
titel: We lieten de AI ons systeem bouwen. Daarna checkte ik de beveiliging.
post_voor: Maandag 2026-05-05
status: draft
seed: geen
meeting_minute_feit: Board meeting 2026-04-16 — B-19 wekelijkse security check week 16 uitgevoerd; 3 HIGH findings gevonden: (1) vite path traversal vulnerability, (2) Lambda CORS origin hardcoded in plaats van corsOrigin() patroon, (3) KennisbankArtikelView.vue v-html zonder DOMPurify sanitisatie (XSS risico). Gefixd in B-21 (CORS), B-22 (npm audit), B-23 (DOMPurify).
vorige_post: episode-02-de-directie.md
---

# Episode 3 — We lieten de AI ons systeem bouwen. Daarna checkte ik de beveiliging.

**Draft:**

𝗪𝗲𝗲𝗸 𝟯 𝘃𝗮𝗻 𝗵𝗲𝘁 𝗔𝗜𝗻𝘁𝗲𝗿𝗻 𝗘𝘅𝗽𝗲𝗿𝗶𝗺𝗲𝗻𝘁. 𝗪𝗲 𝗹𝗶𝗲𝘁𝗲𝗻 𝗱𝗲 𝗔𝗜 𝗼𝗻𝘀 𝘀𝘆𝘀𝘁𝗲𝗲𝗺 𝗯𝗼𝘂𝘄𝗲𝗻. 𝗗𝗮𝗮𝗿𝗻𝗮 𝗰𝗵𝗲𝗰𝗸𝘁𝗲 𝗶𝗸 𝗱𝗲 𝗯𝗲𝘃𝗲𝗶𝗹𝗶𝗴𝗶𝗻𝗴.

Drie kritieke kwetsbaarheden.

Eén in de build-tooling. Eén in de API-laag. Eén in de manier waarop content werd weergegeven — een potentiële ingang voor cross-site scripting.

De AI had het systeem gebouwd. Snel, functioneel, grotendeels correct. Maar beveiliging is precies het soort context dat een taalmodel niet meteen meeneemt als je niet expliciet vraagt.

We vroegen niet expliciet.

Dus checkte ik zelf.

Dat is de kern van het experiment: de AI doet wat je zegt. De menselijke operator zorgt dat je de juiste dingen zegt — en controleert wat er daarna is gebouwd.

Alle drie de lekken werden in hetzelfde board-overleg gevonden én gedicht. Niet omdat de AI ze miste door slordigheid, maar omdat de instructieset incompleet was. Zodra we de beveiligingsvereisten expliciet maakten, werden ze ook correct geïmplementeerd.

Dat is misschien de belangrijkste les van week drie.

De AI is zo goed als de specificaties die je meegeeft.

𝗗𝗶𝘁 𝗶𝘀 𝗮𝗳𝗹𝗲𝘃𝗲𝗿𝗶𝗻𝗴 𝟯 𝘃𝗮𝗻 𝗵𝗲𝘁 𝗔𝗜𝗻𝘁𝗲𝗿𝗻 𝗘𝘅𝗽𝗲𝗿𝗶𝗺𝗲𝗻𝘁.

𝗪𝗼𝗿𝗱𝘁 𝘃𝗲𝗿𝘃𝗼𝗹𝗴𝗱.
