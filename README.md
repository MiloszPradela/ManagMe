# ManagMe: Zaawansowana Aplikacja do Zarządzania Projektami

![ManagMe Logo](client/public/managme-logo.png)

**ManagMe** to kompleksowe rozwiązanie full-stack do zarządzania projektami, zaprojektowane z myślą o efektywnej organizacji pracy zespołowej. Aplikacja umożliwia tworzenie projektów, delegowanie zadań, śledzenie postępów za pomocą kamieni milowych oraz płynną współpracę w zespole.

## Kluczowe Funkcjonalności

-   **Zarządzanie Projektami:** Intuicyjne tworzenie i monitorowanie wielu projektów jednocześnie [web:21].
-   **Dynamiczny System Zadań:** Definiowanie zadań z priorytetami, terminami i statusami (`Do zrobienia`, `W trakcie`, `Zakończone`) [web:23].
-   **Struktura Kamieni Milowych (Milestones):** Dzielenie złożonych zadań na mniejsze, zarządzalne etapy (milestones) w celu lepszego śledzenia postępów [web:25].
-   **Zarządzanie Zespołem:** System autentykacji użytkowników (rejestracja/logowanie) oraz możliwość przypisywania zadań do konkretnych członków zespołu [web:27].
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

