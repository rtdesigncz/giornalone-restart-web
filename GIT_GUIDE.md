# Guida alla Sincronizzazione del Progetto (Git & GitHub)

Questa guida ti spiega come salvare il tuo progetto online (su GitHub) e come lavorarci da più computer mantenendo tutto sincronizzato.

## Prerequisiti

1.  **Account GitHub**: Se non ne hai uno, crealo su [github.com](https://github.com/).
2.  **Git Installato**: Assicurati di avere Git installato sui computer che userai.

---

## 1. Primo Setup (Da fare ORA su questo computer)

Hai già un repository Git locale inizializzato. Ora devi collegarlo a GitHub.

### Passo A: Crea un Repository su GitHub
1.  Vai su [github.com/new](https://github.com/new).
2.  Nome repository: es. `gestionale-consulenze` (o quello che preferisci).
3.  Visibilità: **Private** (consigliato per progetti personali).
4.  **NON** inizializzare con README, .gitignore o license (li abbiamo già).
5.  Clicca su **Create repository**.

### Passo B: Collega il tuo computer a GitHub
Copia l'URL del repository che hai appena creato (sarà tipo `https://github.com/TUO_USERNAME/gestionale-consulenze.git`).

Esegui questi comandi nel terminale del tuo progetto (VS Code -> Terminal -> New Terminal):

```bash
# Sostituisci l'URL con il tuo
git remote add origin https://github.com/TUO_USERNAME/gestionale-consulenze.git

# Rinomina il ramo principale in 'main' (standard moderno)
git branch -M main

# Carica i file online
git push -u origin main
```

*Se è la prima volta, potrebbe chiederti di fare il login a GitHub.*

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
