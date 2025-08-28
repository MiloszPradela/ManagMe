# ManagMe: Zaawansowana Aplikacja do Zarządzania Projektami

![ManagMe Logo](client/public/managme-logo.png)

**ManagMe** to kompleksowe rozwiązanie full-stack do zarządzania projektami, zaprojektowane z myślą o efektywnej organizacji pracy zespołowej. Aplikacja umożliwia tworzenie projektów, delegowanie zadań, śledzenie postępów za pomocą kamieni milowych oraz płynną współpracę w zespole.

## Kluczowe Funkcjonalności

-   **Zarządzanie Projektami:** Intuicyjne tworzenie i monitorowanie wielu projektów jednocześnie.
-   **Dynamiczny System Zadań:** Definiowanie zadań z priorytetami, terminami i statusami (`Do zrobienia`, `W trakcie`, `Zakończone`).
-   **Struktura Kamieni Milowych (Milestones):** Dzielenie złożonych zadań na mniejsze, zarządzalne etapy (milestones) w celu lepszego śledzenia postępów.
-   **Zarządzanie Zespołem:** System autentykacji użytkowników (rejestracja/logowanie) oraz możliwość przypisywania zadań do konkretnych członków zespołu.
-   **Inteligentne Filtrowanie:** Zaawansowane opcje filtrowania zadań i projektów, ułatwiające nawigację i szybki dostęp do informacji.
-   **Responsywny Design (RWD):** W pełni adaptacyjny interfejs użytkownika, zapewniający komfortową pracę na desktopie, tablecie i urządzeniach mobilnych.
-   **Testy End-to-End:** Projekt zawiera kompleksowy zestaw testów E2E napisanych w Cypress, które weryfikują kluczowe ścieżki użytkownika, takie jak logowanie, tworzenie i edycja zadań czy zarządzanie kamieniami milowymi.

## Stos Technologiczny

| Kategoria | Technologia |
| :---------- | :--------------------------------------------- |
| **Frontend**  | TypeScript, Vite, Bootstrap, Cypress |
| **Backend**   | Node.js, Express.js                          |
| **Baza Danych** | MongoDB                                      |
| **Środowisko**| Node.js, npm                                   |

## Uruchomienie Lokalnego Środowiska

Aby uruchomić projekt lokalnie, wymagane jest posiadanie [Node.js](https://nodejs.org/en/) oraz `npm`.

### 1. Konfiguracja Backendu (API)

Backend wymaga pliku `.env` do przechowywania kluczy API i konfiguracji bazy danych.

1.  Przejdź do folderu `api`:
    ```
    cd api
    ```
2.  Stwórz kopię pliku `.env.example` i nazwij ją `.env`:
    ```
    # Na Windows (w PowerShell):
    Copy-Item .env.example .env

    # Na macOS/Linux:
    cp .env.example .env
    ```
3.  Otwórz nowo utworzony plik `.env` i uzupełnij go swoimi danymi (np. `MONGO_URI`, klucze Google).
4.  Zainstaluj zależności serwera:
    ```
    npm install
    ```
5.  Uruchom serwer API:
    ```
    npx start
    ```
    Serwer będzie nasłuchiwał na porcie `3000`.

### 2. Konfiguracja Frontendu (Klient)

1.  Otwórz nowy terminal i przejdź do folderu `client`:
    ```
    cd client
    ```
2.  Zainstaluj zależności:
    ```
    npm install
    ```
3.  Uruchom aplikację kliencką:
    ```
    npm run dev
    ```
4.  Aplikacja będzie dostępna w przeglądarce pod adresem [http://localhost:5173](http://localhost:5173).

## Struktura Projektu
 ```
ManagMe/
├── api/ # Kod źródłowy backendu (Node.js/Express)
│ ├── .env.example # Szablon zmiennych środowiskowych
│ └── ...
├── client/ # Kod źródłowy frontendu (TypeScript/Vite)
│ ├── src/ # Główne pliki aplikacji
│ └── cypress/ # Testy End-to-End
├── .gitignore # Pliki i foldery ignorowane przez Git
└── README.md # Ta dokumentacja
 ```

Projekt stworzony na potrzeby własne przez [MiloszPradela](https://github.com/MiloszPradela).
