export interface User {
  id: number;
  email: string;
  name: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export const authService = {
  async login(email: string, name: string): Promise<AuthResponse> {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, name }),
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Login failed");
    }

    const data = await response.json();
    
    // Store token in localStorage for demo purposes
    // In production, this would be handled via secure cookies
    localStorage.setItem("auth_token", data.token);
    
    return data;
  },

  async getCurrentUser(): Promise<User | null> {
    try {
      const response = await fetch("/api/auth/me", {
        credentials: "include",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("auth_token")}`,
        },
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data.user;
    } catch {
      return null;
    }
  },

  logout(): void {
    localStorage.removeItem("auth_token");
    window.location.href = "/login";
  },
};
