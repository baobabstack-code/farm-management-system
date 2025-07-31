# Overview

This web app is a farm management system designed to help farmers manage their crops, tasks, and logs. It provides a user-friendly interface for creating, reading, updating, and deleting crop records, planning and tracking farming activities, and keeping track of irrigation, fertilization, pest and disease control, and harvesting activities.

To start a test server on your computer, run the command `pnpm dev` in the project directory. Then, open your browser and navigate to `http://localhost:3000` to see the first page of the app.

The purpose of writing this software is to provide a comprehensive tool for farmers to efficiently manage their operations, improve productivity, and make data-driven decisions.

[Software Demo Video](http://youtube.link.goes.here)

# Web Pages

The web app consists of several pages:

- **Dashboard:** The main page that displays an overview of the farm's activities and key metrics.
- **Crops:** A page for managing crop records, including creating new crops, viewing existing crops, and updating crop information.
- **Tasks:** A page for planning and tracking farming activities, with features for assigning tasks, setting priorities, and monitoring progress.
- **Reports:** A page for generating reports on various aspects of the farm's operations, such as crop yields, task completion rates, and resource usage.
- **Login/Register:** Pages for user authentication.

The app transitions between these pages using Next.js routing. Data is dynamically created on each page using React components and data fetched from the database via API endpoints.

# Development Environment

The software was developed using VS Code as the primary code editor. The following tools were also used:

- **Node.js:** JavaScript runtime environment.
- **pnpm:** Package manager.
- **Git:** Version control system.
- **GitHub:** Code hosting platform.

The programming language used is TypeScript, along with the following libraries:

- **Next.js:** React framework for building user interfaces.
- **Prisma:** ORM for database access.
- **NextAuth.js:** Authentication library for Next.js.
- **Tailwind CSS:** Utility-first CSS framework.

# Useful Websites

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

# Future Work

- Implement more advanced reporting features.
- Add support for multiple users and roles.
- Integrate with external data sources, such as weather APIs.
