CSE 310 – Applied Programming
Module Plan

Name: Nyasha Shepard Ushewokunze
Date: 04-07-2025
Module # (1-3): 1

1.  Identify which module you have selected to work on. Place an “X” in front of your selected module.

    Cloud Databases
    Data Analysis
    Game Framework
    GIS Mapping
    Mobile App
    Networking
    SQL Relational Databases
    X Web Apps
    Language – C++
    Language – Java
    Language – Kotlin
    Language – R
    Language – Erlang
    Language – JavaScript
    Language – C#
    Language - TypeScript
    Language – Rust

2.  At a high level, describe the software you plan to create that will fulfill the requirements of this module. Describe how each requirement will be met. This may change as you learn more about the technology or language you are learning.
    A web-based system to help horticulture farmers plan, track, and manage farming operations including planting schedules, irrigation, fertilization, pest control, harvesting, and inventory. I will build a RESTful API that performs Create, Read, Update, and Delete (CRUD) operations on a data resources using Postgres.
    Uses TypeScript interfaces to define data models because they are strongly typed, Request/response types are enforced in Express controllers and Catches errors before runtime.
    The Backend will have RESTful Routes: Implements GET, POST, PUT, and DELETE endpoints. Middleware: Uses Express middleware for logging, error handling, and validation. Modular Structure: Separates routes, controllers, and services for maintainability.
    Features:
    • User authentication (login/register)
    • Task planner for daily and seasonal horticulture operations
    • Crop profile management (add watermelon, tomatoes, etc.)
    • Fertilizer & irrigation logs
    • Pest & disease tracking
    • Harvest reporting & yield tracking
    • Progress dashboard with calendar and analytics
    • Responsive design for mobile and desktop
3.  Create a detailed schedule using the table below to complete your selected module during this Sprint. Include the task and duration for each day. You are expected to spend 24 hours every Sprint working on this individual module and other activities in the course. Time spent on this individual module should be at least 12 hours.

        First Week of Sprint	Second Week of Sprint

    Monday Project Setup (3 hrs)

- Initialize Node.js/TypeScript project
- Install Express, TS dependencies
- Configure basic server Database Integration (3 hrs)
- Implement Postgres storage
- Create data access layer
  Tuesday Core Routes (1 hrs)
- Implement GET all/POST endpoints
- Basic request validation Advanced Features (1 hrs)
- Add PUT/PATCH endpoints
- Implement proper error handling
  Wednesday Type Safety (1 hrs)
- Define TypeScript interfaces
- Add type guards
- Set up ESLint/Prettier Testing (1 hrs)
- Write Jest unit tests
- Test edge cases
  Thursday Middleware (1 hrs)
- Add logging middleware
- Error handling middleware Documentation (1 hrs)
- Write API documentation
- Create Swagger/OpenAPI specs
  Friday Code Quality (.3 hr)
- Refactor code structure
- Improve type safety Final Polish (.3 hr)
- Debugging
- Performance checks
  Saturday Review (.3hr)
- Test endpoints in Postman
- Fix immediate issues Submission Prep (.3 hr)
- Final testing
- Prepare demo

Total Module Hours: 14 hours

4. Identify at least two risks that you feel will make it difficult to succeed in this module. Identify an action plan to overcome each of these risks.
   Risk 1: Complex functionality may exceed time available
   A full-featured farm management system can quickly become complex with multiple modules (task scheduling, reporting, crop tracking, etc.).
   Action Plan: I will begin with a Minimal Viable Product (MVP) that includes core features like crop tracking, irrigation logging, and task management. Advanced features like yield analysis and pest tracking will be considered only after the core is stable and time allows.
   Risk 2: Learning curve with backend integration and database management
   Explanation: Integrating a backend (Node.js + PostgreSQL) with the frontend while managing data securely may present challenges.
   Action Plan: I will use Supabase, a backend-as-a-service that simplifies authentication and database management. I will also review example projects and tutorials to better understand integration. I will schedule buffer time specifically for backend work.
