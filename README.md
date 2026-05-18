# StudentEnrollmentPredictor

## Demo account
Use the following credentials to log into the dashboard:

- **Email:** demo@example.com
- **Password:** Demo123456

> Note: These credentials must exist in your configured Supabase project (Auth) and match whatever password is set for the demo user.


## Supabase configuration

The app requires the following environment variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `VITE_SUPABASE_PROJECT_ID` (optional)
- `SUPABASE_PROJECT_ID` (optional)


Copy `.env.example` to `.env` and replace the placeholders with values from your Supabase project.

## Seeding dummy students

After your database schema is created, you can seed 2,000 dummy students with:

```bash
SUPABASE_URL=your_supabase_url \
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key \
npm run seed:students
```

This script will insert 2,000 rows into the `students` table in your configured Supabase project.

### Forecast data

You can also seed enrollment history used in forecasting with:


```bash
npm run seed:enrollments
```

This will insert one record per semester/program combination and populate the `enrollments` table used by the forecast page.

## Notes

- This project was developed for educational purposes.
- The system predicts future student enrollment trends using Holt-Winters additive seasonal approach.
- Enrollment analytics and visual reports are generated dynamically based on stored student data.
- Some datasets used in the system are sample/demo data for testing purposes only.
- Admin authentication is required to access dashboard management features.
- Forecast results may vary depending on the quality and quantity of historical enrollment data.
- Future improvements may include AI-powered recommendations, real-time analytics, and automated reporting.


