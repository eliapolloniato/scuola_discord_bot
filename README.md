# Liotardobot: bot Discord del server Scuola

## Funzionalità
* Saluta i nuovi membri
* Parsing di link Google meet
* Blocco gif prese da [Tenor](tenor.com) tramite comando **!gif <on/off>**
* Possibilità di cambiare il prefisso tramite il comando **!prefisso \<nuovo prefisso\>**
* Possibilità di cambiare il ruolo per l'accesso a comandi di amministrazione, di default **dev**
* Comando **!elimina \<n messaggi\>** per l'eliminazione veloce di grandi quantità di messaggi (con limitazioni per utenti senza il ruolo per l'accesso dei comandi di amministrazione)

> Nuove funzioni verranno aggiunte quando avrò tempo

---

## Utilizzo senza docker

1. Scaricare il file zip o clonare la repository con il comando `git clone https://github.com/eliapolloniato/scuola_discord_bot.git`
2. Installare le librerie richieste tramite il comando `npm install`
3. Creare un file con all'interno il token del bot e salvarlo con nome **.env**
4. Avviare il bot con il comando `npm start`

---

## Utilizzo con docker

1. Scaricare il file zip o clonare la repository con il comando `git clone https://github.com/eliapolloniato/scuola_discord_bot.git`
2. Creare il file **.env** con all'interno il token del vostro bot
3. Creare ed Avviare il container tramite il comando `bash deployDocker.sh`