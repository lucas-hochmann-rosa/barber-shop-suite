# 💈 Barbershop

<p align="center">
  <a href="https://github.com/lucas-hochmann-rosa/barber-shop-suite">
    <img src="https://img.shields.io/badge/GitHub-barber--shop--suite-181717?style=for-the-badge&logo=github">
  </a>
  <a href="https://www.linkedin.com/in/lucas-hochmann-rosa">
    <img src="https://img.shields.io/badge/LinkedIn-Lucas_Hochmann_Rosa-0A66C2?style=for-the-badge&logo=linkedin">
  </a>
  <a href="#-tech-stack">
    <img src="https://img.shields.io/badge/Java-17-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white">
  </a>
  <a href="#-tech-stack">
    <img src="https://img.shields.io/badge/Spring_Boot-3.2.5-6DB33F?style=for-the-badge&logo=springboot&logoColor=white">
  </a>
  <a href="#-tech-stack">
    <img src="https://img.shields.io/badge/MySQL-8-4479A1?style=for-the-badge&logo=mysql&logoColor=white">
  </a>
  <a href="./LICENSE">
    <img src="https://img.shields.io/badge/License-MIT-2ea44f?style=for-the-badge">
  </a>
</p>

<p align="center"><a href="README.md">🇧🇷 Português</a> · 🇺🇸 English</p>

> Barbershop operational management system structured as a four-module monorepo: a shared business rules core in Java (`core`), a desktop application in Java Swing (`desktop`), a modern web interface in HTML, CSS and JS (`web`), and a Spring Boot REST API back-end (`api`).

---

## ⚡ Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/lucas-hochmann-rosa/barber-shop-suite.git
cd barber-shop-suite

# 2. Spin up MySQL (via Docker or local MySQL on port 3306)
docker compose up -d

# 3. Compile and package all modules (core, desktop, api)
mvn clean package

# 4. Run the Desktop application (Java Swing)
java -jar desktop/target/barber-shop-desktop-1.0-SNAPSHOT.jar

# 5. Run the Spring Boot REST API (Web Back-end)
java -jar api/target/barber-shop-api-1.0-SNAPSHOT.jar
# port 8080

# 6. Optional: load the shared demo database
java -cp desktop/target/barber-shop-desktop-1.0-SNAPSHOT.jar br.com.barbershop.app.SeedDemoData
# or, with the API running: curl -X POST http://localhost:8080/api/dev/seed

# 7. Alternative: serve the static Web Front-end from the repository root
python -m http.server 5500
# access http://localhost:5500/web/index.html (demo login: barbershop / barbershop)
```

With the API started from the repository root, the simplest way to use the web version is to open <http://localhost:8080/index.html>.

---

## 📌 Overview

**Barbershop** is a complete barbershop management system (appointments, staff, services, history, and revenue), built on a modular architecture:

- **Shared Core (`core`)**: Centralizes domain entities, JDBC persistence, idempotent migrations, and core business rules (such as RF11 visual classification and RF10 real time-overlap conflict validation), decoupled from any visual UI.
- **Desktop Application (`desktop`)**: Responsive Java Swing application (FlatLaf Look & Feel) with a visual language aligned to the web interface, automatic bootstrap, services/barbers CRUD, real-time schedule management, reports dashboard, and an operational smoke test (`VerificacaoSistema`).
- **Web Version (`web`)**: Modern static front-end in HTML5, CSS3, and JavaScript, featuring an **interactive daily schedule timeline** and real REST client integration (`web/js/api.js`).
- **Web REST Back-end (`api`)**: Java Web application with Spring Boot 3.2.5 REST, exposing JSON endpoints for authentication, barbershop management, catalog, scheduling, history, and analytics.

---

## 🧠 Features

- Automatic bootstrap: opens the initial setup when the database has no barbershop and login when configuration already exists.
- Idempotent schema initialization and migrations that preserve appointment history.
- Complete initial setup for barbershop data, services, barbers, and administrator credentials.
- Authentication with salted PBKDF2 password hashes and shared session context.
- Daily schedule with timeline, service shortcuts, pending appointments, and status actions.
- Services and barbers CRUD, including optional images stored as Base64.
- Client directory populated automatically from appointments.
- Configurable service duration and business hours.
- Real interval-overlap conflict validation (RF10).
- Visual appointment classification by status and time proximity (RF11).
- History with filters and reports for revenue, services, and barber rankings.
- Optional cancellation reason and WhatsApp shortcut from the desktop appointment view.
- Shared demo database used by desktop, web, and API.
- Brand, service, and avatar SVGs centralized in `shared-assets/img`.
- Rotating file logs under `~/.barbershop/logs/` and HikariCP connection pooling.

---

## 🧭 Table of Contents

- [Architecture](#-architecture)
- [Running Each Module](#-running-each-module)
- [Shared Core and RF11 Parity](#-shared-core-and-rf11-parity)
- [Shared Demo Data](#-shared-demo-data)
- [Shared Images](#-shared-images)
- [Tech Stack](#-tech-stack)
- [Project Construction Rules](#-project-construction-rules)
- [Requirements](#-requirements)
- [Installation and Database](#-installation-and-database)
- [Environment Variables](#-environment-variables)
- [Desktop Deployment](#-desktop-deployment-windows--linux)
- [Main Screens](#-main-screens)
- [Implemented Business Rules](#-implemented-business-rules)
- [Requirements Compliance](#-requirements-compliance)
- [Automated Testing](#-automated-testing)
- [System Verification](#-system-verification-smoke-test)
- [Screenshots](#-screenshots)
- [Author](#-author)
- [License](#-license)

---

## 🏗️ Architecture

```text
barber-shop-suite/
├── pom.xml                             # Parent POM with centralized dependency management
├── docker-compose.yml                  # Pre-configured MySQL 8 container
├── README.md / README.en.md
├── LICENSE
├── docs/                               # Technical documentation and wireframes
│   ├── screenshots/
│   └── wireframes/
│
├── shared-assets/
│   └── img/                            # Official source for brand, service, and avatar SVGs
│
├── core/                               # [MODULE 1] Shared business rules core (Java)
│   ├── pom.xml
│   └── src/
│       ├── main/java/br/com/barbershop/
│       │   ├── model/                  # Domain POJOs
│       │   ├── dao/                    # JDBC/MySQL access layer (Repository Pattern)
│       │   ├── service/                # Business services (Agenda, Auth, Catalogo, Classificador, Relatorio)
│       │   ├── seed/                   # Shared demo data, independent from Spring and Swing
│       │   └── util/                   # Security hashing and date utilities
│       └── test/java/                  # 52 unit tests with in-memory fake repositories
│
├── desktop/                            # [MODULE 2] Desktop Java Swing interface (FlatLaf)
│   ├── pom.xml
│   ├── nbactions.xml                   # Run and debug actions for Apache NetBeans
│   └── src/main/java/br/com/barbershop/
│       ├── app/                        # Main entry point, ServiceFactory, SystemVerification, and SeedDemoData
│       └── ui/                         # Swing views and controllers
│
├── web/                                # [MODULE 3] Front-end Web (HTML5, CSS3, JavaScript)
│   ├── index.html, agenda.html, agendamento.html, barbearia.html, historico.html, relatorios.html
│   ├── verificacao-classificacao.html  # Visual runner for RF11 parity verification
│   ├── css/                            # Modular styles
│   └── js/                             # UI logic and REST client (api.js)
│
└── api/                                # [MODULE 4] Spring Boot 3.2.5 REST API
    ├── pom.xml
    ├── nbactions.xml                   # Spring Boot run, debug, and profile actions for NetBeans
    └── src/
        ├── main/java/br/com/barbershop/api/
        │   ├── Application.java
        │   ├── config/                 # ServiceConfig and WebMvcConfig (CORS/Static)
        │   ├── controller/             # REST Controllers (Auth, Barbearia, Catalogo, Agenda, Historico, Relatorios, DevSeed)
        │   └── dto/                    # Data Transfer Objects
        └── test/java/                  # 16 MockMvc integration tests
```

---

## 🚀 Running Each Module

### 1. `core`

Shared domain and data-access library consumed by the desktop app and the API:

```bash
mvn test -pl core
```

### 2. `desktop`

Requires JDK 17+ and MySQL 8:

```bash
docker compose up -d
mvn clean package -pl desktop -am
java -jar desktop/target/barber-shop-desktop-1.0-SNAPSHOT.jar
```

Apache NetBeans can run the `desktop` module through its `nbactions.xml`.

### 3. `api`

```bash
mvn install -pl core -am -DskipTests
mvn -f api/pom.xml spring-boot:run
# or
mvn clean package -pl api -am
java -jar api/target/barber-shop-api-1.0-SNAPSHOT.jar
```

The API is available at `http://localhost:8080/api/` and also serves the `web/` front-end. In Apache NetBeans, the `api` module Run action is bound to `spring-boot:run` through `api/nbactions.xml`.

### 4. `web`

The recommended option is to start the API from the repository root and open <http://localhost:8080/index.html>. Alternatively, run `python -m http.server 5500` from the repository root and access <http://localhost:5500/web/index.html>; the client then reads and writes data through `http://localhost:8080/api`.

Demo credentials after loading the demo database:

- **User:** `barbershop`
- **Password:** `barbershop`

If the initial setup flow is completed manually, use the credentials created in that setup.

---

## 🔄 Shared Core and RF11 Parity

The RF11 schedule classification rule lives in the shared `core` module through `br.com.barbershop.service.ClassificadorAgenda`. The web version mirrors the same rule in `web/js/classificacao.js`, and `web/verificacao-classificacao.html` runs the browser-side parity checks against the same classification scenarios covered by JUnit.

---

## 🌱 Shared Demo Data

The web front-end no longer uses static JavaScript arrays as its data source. Demo data is written to MySQL by `br.com.barbershop.seed.DadosDemonstracaoSeeder` in the `core` module, using only public services (`SetupService`, `CatalogoService`, `AgendaService`, and `BarbeariaService`). That keeps desktop, web, and API pointed at the same barbershop, services, barbers, users, and appointments.

Seeding is manual and idempotent: `semearSeNecessario()` only inserts data when `BarbeariaService.buscarPrimeira()` returns `null`, preserving the empty-database RF01 setup scenario.

```bash
# Desktop command-line seed
mvn clean package -pl desktop -am
java -cp desktop/target/barber-shop-desktop-1.0-SNAPSHOT.jar br.com.barbershop.app.SeedDemoData

# Development API seed, after starting the API
curl -X POST http://localhost:8080/api/dev/seed
```

There is also a **Carregar dados de demonstração** button in the desktop initial setup screen. The seed includes one barbershop, six services, four barbers, the `barbershop` user with a real `HashUtil` password hash, and appointments distributed across RF11 classifications.

---

## 🖼️ Shared Images

Logo, service, and avatar SVG files have a single versioned source: `shared-assets/img`. The web front-end references those files through `/shared-assets/img/...`, the API exposes that path as a static resource in development, and the desktop module does not keep manual copies. During `generate-resources`, `maven-resources-plugin` copies `../shared-assets/img` into the desktop classpath (`target/classes/img`), and Swing screens load those SVGs through `FlatSVGIcon`.

This keeps the visual identity aligned across web, API, and desktop, avoids asset drift, and preserves a text fallback in Swing when an icon cannot be found in the build.

---

## 🛠️ Tech Stack

- **Platform:** Java 17 · Spring Boot 3.2.5 · HTML5 / CSS3 / Vanilla JavaScript
- **Build System:** Apache Maven (multi-module monorepo)
- **Desktop UI:** Java Swing (FlatLaf `3.4.1` and FlatLaf Extras for SVG rendering)
- **Web Back-end:** Spring Boot 3.2.5 REST (Spring MVC, Jackson JSR-310)
- **Database:** MySQL 8 + JDBC (`mysql-connector-j 8.3.0`), HikariCP `5.1.0`
- **Testing:** JUnit 5 (Jupiter) & Spring MockMvc (68 automated tests)
- **Containerization:** Docker & Docker Compose

---

## 📐 Project Construction Rules

- New technical logic uses English identifiers for classes, methods, variables, routes, JSON contracts, tables, and columns. Existing Portuguese domain names remain when they are already part of the project contract.
- Code comments explain non-obvious decisions and constraints, not self-evident operations.
- User-facing text in Swing and web interfaces remains in Portuguese.
- No production credential is committed. `config.properties` contains local defaults only and every database setting can be overridden through environment variables.

---

## ⚙️ Requirements

- JDK 17 or newer available on `PATH`
- MySQL 8, locally installed or started through Docker Compose
- A MySQL user allowed to create and alter tables in the `barbershop` schema
- Maven 3.8 or newer when running outside Apache NetBeans
- A current web browser such as Chrome, Firefox, Edge, or Safari

---

## 🔧 Installation and Database

```bash
git clone https://github.com/lucas-hochmann-rosa/barber-shop-suite.git
cd barber-shop-suite
```

Recommended local database setup:

```bash
docker compose up -d
```

This starts MySQL 8 with the local defaults expected by the project. With a native MySQL installation, create the database first:

```sql
CREATE DATABASE barbershop;
```

The applications create the tables and run idempotent migrations on startup through `core/src/main/resources/db/schema.sql`.

---

## 🔐 Environment Variables

Default connection settings are stored in `core/src/main/resources/config.properties`:

```properties
db.url=jdbc:mysql://localhost:3306/barbershop?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=America/Sao_Paulo
db.user=root
db.password=
db.driver=com.mysql.cj.jdbc.Driver
```

| Variable | Description | Default |
| --- | --- | --- |
| `DB_URL` | JDBC connection URL | `jdbc:mysql://localhost:3306/barbershop...` |
| `DB_USER` | MySQL user | `root` |
| `DB_PASSWORD` | MySQL password | *(empty)* |
| `DB_DRIVER` | JDBC driver class | `com.mysql.cj.jdbc.Driver` |

---

## 📦 Desktop Deployment (Windows / Linux)

The desktop build produces a single executable shaded JAR containing its runtime dependencies:

```bash
mvn clean package -pl desktop -am
```

Generated file: `desktop/target/barber-shop-desktop-1.0-SNAPSHOT.jar`.

On Windows:

```powershell
java -jar desktop\target\barber-shop-desktop-1.0-SNAPSHOT.jar
```

On Linux:

```bash
java -jar desktop/target/barber-shop-desktop-1.0-SNAPSHOT.jar
```

---

## 🖥️ Main Screens

| Desktop Screen | Web Equivalent | REST Endpoint | Purpose |
| --- | --- | --- | --- |
| `TelaCadastroInicial` | `barbearia.html` (first access) | `POST /api/barbearia/setup` | Initial barbershop configuration (RF01) |
| `TelaLogin` | `index.html` | `POST /api/auth/login` | Credential authentication (RF02) |
| `TelaHome` | `agenda.html` | `GET /api/agenda/hoje` | Daily schedule, visual timeline, and status actions (RF07, RF08, RF11) |
| `Minha Barbearia` | `barbearia.html` | `GET /api/servicos`, `GET /api/barbeiros` | Barbershop, service, and barber management (RF03, RF04) |
| `Histórico` | `historico.html` | `GET /api/historico` | Appointment history with filters (RF09) |
| `TelaNovoAgendamento` | `agendamento.html` | `POST /api/agenda` | Appointment creation and conflict validation (RF05, RF06, RF10) |
| `Clientes` tab | - | - | Consolidated client directory |
| `Relatórios` | `relatorios.html` | `GET /api/relatorios` | Revenue, service, and barber reports (RF09) |

---

## 📋 Implemented Business Rules

- An empty database starts the initial setup flow; an existing barbershop requires authentication.
- Passwords are stored as salted PBKDF2 hashes.
- Appointments require client, contact, date/time, service, barber, and contact origin.
- The daily schedule shows only `AGENDADO` and `EM_ATENDIMENTO` appointments; history contains every status.
- Barber conflicts use the real duration of both overlapping intervals.
- Appointments outside configured business hours are rejected.
- Cancellation accepts an optional reason.
- RF11 classification is applied to both the desktop table and the web timeline/table.

---

## 🔎 Requirements Compliance

- **RF01:** Initial barbershop, service, barber, and administrator setup. **Status:** Implemented.
- **RF02:** Login and password authentication. **Status:** Implemented.
- **RF03:** Create, update, and delete services. **Status:** Implemented.
- **RF04:** Create, update, and delete barbers. **Status:** Implemented.
- **RF05:** Create appointments with all operational fields. **Status:** Implemented.
- **RF06:** Update and delete appointments. **Status:** Implemented.
- **RF07:** Start and complete appointments. **Status:** Implemented.
- **RF08:** Show only pending appointments on the daily schedule. **Status:** Implemented.
- **RF09:** Provide complete history and reports. **Status:** Implemented.
- **RF10:** Detect real time overlap by barber and service duration. **Status:** Implemented.
- **RF11:** Visually classify appointments by time proximity and status. **Status:** Implemented.
- **RF12:** Integrate the web client with REST endpoints for every main workflow. **Status:** Implemented.

---

## 🧪 Automated Testing

```bash
mvn clean test
```

Executes 68 automated tests:
- 52 unit tests across `core` services and domain models.
- 16 integration and controller tests across `api` REST endpoints.

---

## ✅ System Verification (Smoke Test)

In addition to in-memory automated tests, the desktop module contains an operational verifier that exercises the system against a real MySQL database:

```bash
docker compose up -d
mvn clean package -pl desktop -am
java -cp desktop/target/barber-shop-desktop-1.0-SNAPSHOT.jar br.com.barbershop.app.VerificacaoSistema
```

---

## 📸 Screenshots

### Desktop

| Desktop Login | Desktop Initial Setup |
| --- | --- |
| ![Desktop login screen](docs/screenshots/login-desktop.png) | ![Desktop initial setup screen](docs/screenshots/cadastro-inicial-desktop.png) |

| Desktop Home (Schedule) | Desktop New Appointment |
| --- | --- |
| ![Desktop home screen](docs/screenshots/home-desktop.png) | ![Desktop new appointment screen](docs/screenshots/novo-agendamento-desktop.png) |

| Desktop Edit Appointment | Desktop Manage Barber |
| --- | --- |
| ![Desktop edit appointment screen](docs/screenshots/editar-agendamento-desktop.png) | ![Desktop manage barber dialog](docs/screenshots/gerenciar-barbeiro-desktop.png) |

| Desktop My Barbershop | Desktop History |
| --- | --- |
| ![Desktop My Barbershop screen](docs/screenshots/minha-barbearia-desktop.png) | ![Desktop history screen](docs/screenshots/historico-desktop.png) |

| Desktop Reports |
| --- |
| ![Desktop reports screen](docs/screenshots/relatorios-desktop.png) |

### Web

| Web Login | Web Home (Schedule) |
| --- | --- |
| ![Web login screen](docs/screenshots/login-web.png) | ![Web home screen](docs/screenshots/home-web.png) |

| Web New Appointment | Web My Barbershop |
| --- | --- |
| ![Web new appointment screen](docs/screenshots/novo-agendamento-web.png) | ![Web My Barbershop screen](docs/screenshots/minha-barbearia-web.png) |

| Web History | Web Reports |
| --- | --- |
| ![Web history screen](docs/screenshots/historico-web.png) | ![Web reports screen](docs/screenshots/relatorios-web.png) |

---

## 👨‍💻 Author

**Lucas Hochmann Rosa**

- Repository: <https://github.com/lucas-hochmann-rosa/barber-shop-suite>
- GitHub: <https://github.com/lucas-hochmann-rosa>
- LinkedIn: <https://www.linkedin.com/in/lucas-hochmann-rosa>

---

## 📄 License

Distributed under the MIT License. See [LICENSE](./LICENSE) for details.

The MIT License covers original code and assets in this repository. Third-party libraries and tools remain subject to their respective licenses.
