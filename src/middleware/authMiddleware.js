export const adminMiddleware = async (ctx, next) => {
  const user = await ctx.state.session.get("user");
  if (!user) {
    ctx.response.redirect("/admin/login");
    return;
  }

  // Session-Verlängerung: Setze Timestamp für letzte Aktivität
  const now = Date.now();
  const lastActivity = (await ctx.state.session.get("lastActivity")) || 0;
  const sessionTimeout = 24 * 60 * 60 * 1000; // 24 Stunden in Millisekunden

  // Prüfe, ob Session abgelaufen ist
  if (now - lastActivity > sessionTimeout) {
    await ctx.state.session.set("user", null);
    await ctx.state.session.set("lastActivity", null);
    ctx.response.redirect("/admin/login?error=Session%20abgelaufen");
    return;
  }

  // Aktualisiere letzte Aktivität nur alle 5 Minuten, um Overhead zu reduzieren
  if (now - lastActivity > 5 * 60 * 1000) {
    // 5 Minuten
    await ctx.state.session.set("lastActivity", now);
  }

  ctx.state.user = user;
  await next();
};
