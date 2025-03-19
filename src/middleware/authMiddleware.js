export const adminMiddleware = async (ctx, next) => {
    const user = await ctx.state.session.get("user");
    if (!user) {
      ctx.response.redirect("/admin/login");
      return;
    }
    ctx.state.user = user;
    await next();
  };