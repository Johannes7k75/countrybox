export default defineNuxtRouteMiddleware(async () => {
  const { loggedIn, user } = useUserSession();

  if (!loggedIn.value || !user.value || !user.value.token) {
    return await navigateTo("/login");
  }

  const isValid = await $fetch("/api/validSession", {
    method: "POST",
    body: {
      email: user.value.email,
      token: user.value.token,
    },
  });

  console.log(isValid);

  // redirect the user to the login screen if they're not authenticated
});
