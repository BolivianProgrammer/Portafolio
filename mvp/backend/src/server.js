const { createApp } = require("./app");
const { crearPool, migrar } = require("./db");

const PORT = Number(process.env.PORT || 3000);

async function main() {
  const pool = crearPool();
  await migrar(pool);
  createApp(pool).listen(PORT, () => console.log(`CompaEstudio API en http://localhost:${PORT}`));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
