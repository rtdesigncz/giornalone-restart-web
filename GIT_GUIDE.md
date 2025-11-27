# Guida alla Sincronizzazione del Progetto (Git & GitHub)

Questa guida ti spiega come salvare il tuo progetto online (su GitHub) e come lavorarci da più computer mantenendo tutto sincronizzato.

## Prerequisiti

1.  **Account GitHub**: Se non ne hai uno, crealo su [github.com](https://github.com/).
2.  **Git Installato**: Assicurati di avere Git installato sui computer che userai.

---

## 1. Ricollegare al Repository Esistente

Poiché hai già un repository su GitHub, dobbiamo collegare questo progetto a quello esistente.

### Passo A: Trova l'URL del tuo Repository
Vai su GitHub, apri il tuo repository e clicca sul pulsante verde **Code**. Copia l'URL (es. `https://github.com/TUO_USERNAME/NOME_REPO.git`).

### Passo B: Collega e Aggiorna
Esegui questi comandi nel terminale di VS Code:

```bash
# 1. Collega il repository remoto (sostituisci l'URL con il tuo)
git remote add origin https://github.com/TUO_USERNAME/NOME_REPO.git

# 2. Scarica la storia dal server (senza unire ancora)
git fetch origin

# 3. Forza l'aggiornamento del server con la TUA versione attuale
# ATTENZIONE: Questo sovrascriverà quello che c'è online con quello che hai qui.
# Dato che hai detto che questa è la versione con le "nuove implementazioni", è quello che vogliamo.
git push -f origin main
```

---

## 2. Lavorare da un SECONDO Computer

Quando vuoi lavorare da un altro PC:

1.  Installa Git e VS Code.
2.  Apri il terminale e scarica il progetto (clona):
    ```bash
    git clone https://github.com/TUO_USERNAME/gestionale-consulenze.git
    ```
3.  Entra nella cartella:
    ```bash
    cd gestionale-consulenze
    ```
4.  Installa le dipendenze (librerie):
    ```bash
    npm install
    ```
5.  Avvia il progetto:
    ```bash
    npm run dev
    ```

---

## 3. Flusso di Lavoro Quotidiano (Aggiornare le modifiche)

La regola d'oro è: **PULL prima di iniziare, PUSH quando hai finito.**

### Quando inizi a lavorare (su qualsiasi PC):
Scarica le ultime modifiche fatte altrove:
```bash
git pull
```

### Quando hai finito le modifiche:
Salva e invia tutto online:

1.  **Aggiungi i file modificati:**
    ```bash
    git add .
    ```
2.  **Salva con un messaggio (Commit):**
    ```bash
    git commit -m "Descrizione di cosa ho fatto"
    ```
    *(Es: "Aggiunta pagina clienti", "Corretto bug calendario")*
3.  **Invia online (Push):**
    ```bash
    git push
    ```

---

## Risoluzione Problemi Comuni

-   **Conflict**: Se hai modificato lo stesso file su due PC diversi senza sincronizzare, Git ti avviserà. Dovrai aprire i file, scegliere quali modifiche tenere e poi fare di nuovo add/commit/push.
-   **Dimenticato il Push**: Se cambi PC e non vedi le modifiche, probabilmente hai dimenticato di fare `git push` dal primo PC. Torna lì e fallo.
