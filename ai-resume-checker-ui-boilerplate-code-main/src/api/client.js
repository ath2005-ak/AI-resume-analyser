import axios from "axios";

export const apiClient = axios.create({
  baseURL: "/api",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;
    const message =
      err.response?.data?.error?.message ||
      err.message ||
      "Request failed";

    // 401 Session expired handling: redirect unauthenticated protected requests to login
    if (status === 401 && typeof window !== "undefined") {
      const currentPath = window.location.pathname;
      const isPublicRoute =
        currentPath === "/login" ||
        currentPath === "/register" ||
        currentPath === "/";

      // If user is on a protected route and session has expired, redirect to login
      if (!isPublicRoute) {
        const redirectParam = encodeURIComponent(currentPath + window.location.search);
        // Avoid redirect loops if already navigating to login
        if (!window.location.href.includes("/login?redirect=")) {
          window.location.href = `/login?redirect=${redirectParam}&expired=true`;
        }
      }
    }

    return Promise.reject({
      status,
      message,
      details: err.response?.data?.error?.details,
      original: err,
    });
  }
);
