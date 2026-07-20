/**
 * App-level constants.
 *
 * Domain enums (moods, learning categories, skills, …) live in
 * `types/domain.ts` and `lib/domain.ts` and are added in Phase 2.
 * This file holds only stable, cross-cutting app configuration.
 */

export const APP_NAME = "Altiora";

export const APP_DESCRIPTION =
  "Callour Studio's internship intelligence platform.";

/** Central route map. Import from here instead of hardcoding paths. */
export const ROUTES = {
  home: "/",
  login: "/auth/login",
  authCallback: "/auth/callback",
  dashboard: "/dashboard",
  reports: "/reports",
  newReport: "/reports/new",
  report: (id: string) => `/reports/${id}`,
  editReport: (id: string) => `/reports/${id}/edit`,
  intern: (internshipId: string) => `/interns/${internshipId}`,
  internshipComplete: "/internship-complete",
  settings: "/settings",
  // Admin management
  adminInterns: "/admin/interns",
  adminMentors: "/admin/mentors",
  adminMentor: (id: string) => `/admin/mentors/${id}`,
  adminCohorts: "/admin/cohorts",
} as const;
