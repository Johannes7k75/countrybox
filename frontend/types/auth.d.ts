declare module '#auth-utils' {
    interface User {
        email: string;
        token: string;
        isGuest: boolean;
      }

    interface UserSession {

    }

    interface SecureSessionData {

    }
}

export {}