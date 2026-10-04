export type AuthUser = {
  id: string;
  email: string;
  nombre: string | null;
  creadoEn: string;
};

export type AuthResponse = {
  data: {
    user: AuthUser;
  };
};
