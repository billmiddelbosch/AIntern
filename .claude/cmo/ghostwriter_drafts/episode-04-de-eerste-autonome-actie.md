---
serie: Het AIntern Experiment
episode: 4
titel: De AI begon deze week zelfstandig e-mails te sturen.
post_voor: Donderdag 2026-05-07
status: draft
seed: geen
meeting_minute_feit: Board meeting 2026-05-01 / week 18 — B-88d: sequence-scheduler.ts verstuurt gepersonaliseerde e-mails via AWS SES vanuit sanne@aintern.nl. Eerste autonome externe communicatie door een AI-agent van AIntern. Lead-matcher Lambda (B-88c) verrijkt leads met e-mailadressen via Apollo API. SSM webhook (/aintern/{alias}/zapier/gmail-webhook-url) ontbreekt nog — trigger mist.
vorige_post: episode-03-het-eerste-lek.md
---

# Episode 4 — De AI begon deze week zelfstandig e-mails te sturen.

**Draft:**

𝗪𝗲𝗲𝗸 𝟱 𝘃𝗮𝗻 𝗵𝗲𝘁 𝗔𝗜𝗻𝘁𝗲𝗿𝗻 𝗘𝘅𝗽𝗲𝗿𝗶𝗺𝗲𝗻𝘁. 𝗗𝗲 𝗔𝗜 𝗯𝗲𝗴𝗼𝗻 𝗱𝗲𝘇𝗲 𝘄𝗲𝗲𝗸 𝘇𝗲𝗹𝗳𝘀𝘁𝗮𝗻𝗱𝗶𝗴 𝗲-𝗺𝗮𝗶𝗹𝘀 𝘁𝗲 𝘀𝘁𝘂𝗿𝗲𝗻.

Niet naar mij. Naar prospects.

We hebben een email sequentie gebouwd die automatisch gepersonaliseerde berichten verstuurt — namens Sanne, via het AIntern domein, met door AI geschreven content op basis van het profiel van de ontvanger.

Dat klinkt logisch als je het zo opschrijft.

Maar op het moment dat het live ging, voelde het anders.

De code stond al weken klaar. De Lambda draait. SES is geconfigureerd. Een tweede systeem — de lead-matcher — zoekt automatisch e-mailadressen op voor elke lead die binnenkomt. En dan triggert de sequentie. Zonder dat ik iets doe.

Dat is het experiment.

Niet: kan AI helpen met schrijven of plannen? Maar: kan AI een stuk van de commerciële cyclus zelfstandig uitvoeren?

Deze week is het antwoord: bijna.

Er ontbreekt nog één schakel — een webhook URL in SSM die ik zelf moet instellen. Vijf minuten werk. Maar het systeem wacht op mij.

Dat is misschien het eerlijkste beeld van waar we nu staan. De infrastructuur is klaar. De autonomie is gebouwd. En er is één handmatig moment over — de menselijke operator die de brug oversteekt.

Ik ga die brug deze week oversteken.

𝗗𝗶𝘁 𝗶𝘀 𝗮𝗳𝗹𝗲𝘃𝗲𝗿𝗶𝗻𝗴 𝟰 𝘃𝗮𝗻 𝗵𝗲𝘁 𝗔𝗜𝗻𝘁𝗲𝗿𝗻 𝗘𝘅𝗽𝗲𝗿𝗶𝗺𝗲𝗻𝘁.

𝗪𝗼𝗿𝗱𝘁 𝘃𝗲𝗿𝘃𝗼𝗹𝗴𝗱.
