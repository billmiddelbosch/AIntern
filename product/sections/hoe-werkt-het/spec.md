# Hoe werkt het? Specification

## Overview
Een visueel aantrekkelijke sectie die het AIntern-traject in 3 stappen uitlegt via een diagonale flow. Elke stap heeft een groot nummer, een icoon, een titel en een korte beschrijving. De sectie is bewust simpel gehouden — geen CTA, naadloze overgang naar de volgende sectie.

## User Flows
- Bezoeker scrollt de sectie in en ziet de drie stappen in een diagonaal patroon
- Per stap leest de bezoeker wat er in die fase concreet gebeurt
- De visuele flow leidt de blik natuurlijk van stap 1 naar stap 3

## UI Requirements
- Sectiebrede achtergrond die visueel afwijkt van de hero (bijv. licht slate of subtiel patroon)
- 3 stappen in een diagonale/gestapelde flow layout
- Elke stap: groot getal (01/02/03), icoon, titel, beschrijving (2-3 zinnen)
- Verbindingselement (lijn of pijl) tussen de stappen
- Volledig tweetalig (NL/EN via i18n)
- Mobiel: stappen onder elkaar (verticale flow)

## Configuration
- shell: true
