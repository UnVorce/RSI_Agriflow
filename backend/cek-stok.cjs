const prisma = require('./src/config/database').default;
async function main() {
  try {
    // Cari user distributor
    const users = await prisma.\("SELECT UserId, FirstName, Email FROM [master].[USER] WHERE RoleId = (SELECT RoleId FROM ref.ROLE WHERE RoleName = 'DISTRIBUTOR')");
    console.log('=== DISTRIBUTOR USERS ===');
    console.log(JSON.stringify(users, null, 2));

    // Cek stok untuk distributor
    const stocks = await prisma.\("SELECT s.UserId, s.PupukId, s.Jumlah, p.JenisPupuk FROM trans.STOK s JOIN master.PUPUK p ON s.PupukId = p.PupukId ORDER BY s.UserId");
    console.log('\n=== ALL STOCK ===');
    console.log(JSON.stringify(stocks, null, 2));
  } catch(e) { console.error('ERR:', e.message); }
  await prisma.\();
}
main();
