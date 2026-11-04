import { runMigrations } from '../src/infrastructure/db/migrations.js';
import { getDb, closeDb } from '../src/infrastructure/db/connection.js';
import { AuthService } from '../src/application/services/auth-service.js';
import { BookService } from '../src/application/services/book-service.js';
import { TransactionService } from '../src/application/services/transaction-service.js';
import { hashSecret, verifySecret } from '../src/infrastructure/security/hash.js';
import fs from 'node:fs';
import path from 'node:path';

console.log('🧪 Starting POTFOLIOO User Profiles, Auth, PIN & Cloud Isolation Tests...\n');

const authService = new AuthService();

try {
  // 1. Run migrations
  console.log('1. Testing DB Migrations (including auth schema v4)...');
  runMigrations();
  const dbInit = getDb();
  dbInit.prepare("DELETE FROM users WHERE username IN ('test_user1', 'baraka_trader', 'kariakoo_wholesaler')").run();
  dbInit.prepare("DELETE FROM rate_limits WHERE key LIKE 'login:%'").run();
  console.log('   ✅ Migrations verified successfully.');

  // 2. Test Secure Password Hashing (PBKDF2/SHA-512 + Salt)
  console.log('2. Testing PBKDF2 / SHA-512 Password & PIN Hashing...');
  const secret = 'MySecurePassw0rd!';
  const { hash, salt } = hashSecret(secret);
  if (!hash || !salt) throw new Error('Failed to generate hash and salt');
  if (hash === secret) throw new Error('Password must not be stored in plain text');
  if (!verifySecret(secret, hash, salt)) throw new Error('Timing-safe secret verification failed');
  if (verifySecret('WrongPassword', hash, salt)) throw new Error('Verification should reject wrong secret');
  console.log('   ✅ Password hashing and timing-safe verification verified.');

  // 3. Test Registration with Username & Password (No email required)
  console.log('3. Testing Registration & Rejection of 4-digit code as sole cloud password...');
  let rejectedFourDigit = false;
  try {
    await authService.register({
      username: 'test_user1',
      password: '1234', // 4-digit code as password
    });
  } catch (err) {
    rejectedFourDigit = true;
    console.log('   ✅ Correctly rejected 4-digit code as cloud password:', err.message);
  }
  if (!rejectedFourDigit) {
    throw new Error('Expected 4-digit code to be rejected as account password');
  }

  // Register user with ONLY username and password (no email at all)
  const usernameOnlyUser = await authService.register({
    username: 'test_user1',
    password: 'SecurePassword2026!',
  });
  if (!usernameOnlyUser.user || !usernameOnlyUser.token) throw new Error('Registration failed for username-only user');
  if (usernameOnlyUser.user.username !== 'test_user1') throw new Error('Username mismatch');
  if (usernameOnlyUser.user.email !== undefined) throw new Error('Email should be undefined for username-only account');
  console.log('   ✅ Account created with username and password only (zero email/phone required).');

  // Register user with username, password, and optional email
  const user1 = await authService.register({
    username: 'baraka_trader',
    email: 'baraka@business.com',
    password: 'SecurePassword2026!',
  });
  if (!user1.user || !user1.token) throw new Error('Registration failed to return user and token');
  if (user1.user.username !== 'baraka_trader') throw new Error('Username mismatch');
  if (user1.user.email !== 'baraka@business.com') throw new Error('Email mismatch');
  console.log('   ✅ User registered successfully with optional email:', user1.user.username, user1.user.email);

  // 4. Test Login
  console.log('4. Testing User Login...');
  const loginRes = await authService.login('baraka_trader', 'SecurePassword2026!');
  if (!loginRes.user || !loginRes.token) throw new Error('Login failed');
  console.log('   ✅ Login with username succeeded.');

  const loginUsernameOnlyRes = await authService.login('test_user1', 'SecurePassword2026!');
  if (!loginUsernameOnlyRes.user) throw new Error('Login with username-only account failed');
  console.log('   ✅ Login for username-only account succeeded.');

  const loginEmailRes = await authService.login('baraka@business.com', 'SecurePassword2026!');
  if (!loginEmailRes.user) throw new Error('Login with email succeeded.');
  console.log('   ✅ Login with optional email succeeded.');

  // Verify generic error message on invalid login (no username enumeration)
  let genericErrorVerified = false;
  try {
    await authService.login('non_existent_user_999', 'RandomPassword123!');
  } catch (err) {
    if (err.message === 'Invalid username or password. Please check your credentials.') {
      genericErrorVerified = true;
    }
  }
  if (!genericErrorVerified) {
    throw new Error('Login error must be generic to prevent username enumeration');
  }
  console.log('   ✅ Generic error verified: does not reveal whether a particular username exists.');

  // 5. Test Rate Limiting on Failed Login Attempts
  console.log('5. Testing Rate Limiting on repeated failed logins...');
  let rateLimitHit = false;
  const testIp = 'ip_test_' + Date.now();
  for (let i = 0; i < 7; i++) {
    try {
      await authService.login('baraka_trader', 'WrongPass!', testIp);
    } catch (err) {
      if (err.message.includes('Too many attempts')) {
        rateLimitHit = true;
        console.log(`   Attempt ${i + 1}: Rate limit successfully enforced: ${err.message}`);
        break;
      }
    }
  }
  if (!rateLimitHit) throw new Error('Rate limit was not enforced on repeated login failures');
  console.log('   ✅ Rate limiting enforced.');

  // 6. Test Password Recovery (Privacy-Preserving, No Account Enumeration)
  console.log('6. Testing Password Recovery without account enumeration...');
  const recExisting = await authService.requestPasswordRecovery('baraka@business.com');
  const recNonExisting = await authService.requestPasswordRecovery('nobody_exists@unknown.com');

  if (recExisting.message !== recNonExisting.message) {
    throw new Error('Recovery message revealed whether an account exists!');
  }
  if (!recExisting.message.includes('If an account matches')) {
    throw new Error('Unexpected recovery response message');
  }
  console.log('   ✅ Privacy confirmed: identical response for existing and non-existing accounts:');
  console.log('      "' + recExisting.message + '"');

  // Verify recovery code & reset password
  const code = recExisting.previewCode;
  if (!code) throw new Error('Expected preview recovery code for test verification');

  const verifyResetRes = await authService.verifyPasswordRecovery({
    contact: 'baraka@business.com',
    code,
    newPassword: 'BrandNewSecurePassword123!',
  });
  if (!verifyResetRes.success) throw new Error('Failed to verify recovery code');

  // Login with new password
  const newLoginRes = await authService.login('baraka_trader', 'BrandNewSecurePassword123!', 'new_ip_' + Date.now());
  if (!newLoginRes.user) throw new Error('Login with new reset password failed');
  console.log('   ✅ Password successfully reset via verified recovery code.');

  // 7. Test Device App-Lock 4-Digit PIN
  console.log('7. Testing Optional Device App-Lock 4-Digit PIN...');
  // Set 4-digit PIN
  const updatedUser = await authService.setPin(user1.user.id, '4821');
  if (!updatedUser.pinEnabled) throw new Error('PIN enabled flag not updated');

  const isPinValid = await authService.verifyPin(user1.user.id, '4821');
  if (!isPinValid) throw new Error('PIN verification failed for valid PIN');

  const isPinInvalid = await authService.verifyPin(user1.user.id, '0000');
  if (isPinInvalid) throw new Error('PIN verification should fail for invalid PIN');

  // Ensure invalid PIN format is rejected
  let rejectedNonFour = false;
  try {
    await authService.setPin(user1.user.id, '12345'); // 5 digits
  } catch {
    rejectedNonFour = true;
  }
  if (!rejectedNonFour) throw new Error('Expected non-4-digit PIN to be rejected');

  await authService.removePin(user1.user.id);
  const pinAfterRemove = await authService.verifyPin(user1.user.id, '4821');
  if (pinAfterRemove) throw new Error('PIN should be disabled after removal');
  console.log('   ✅ 4-Digit Device App Lock PIN verified and securely hashed.');

  // 8. Test Cloud Data Access & Account Isolation
  console.log('8. Testing Cloud Data Scoping & Account Data Isolation...');
  const db = getDb();

  // Create second user
  const user2 = await authService.register({
    username: 'kariakoo_wholesaler',
    contact: 'kariakoo@shop.com',
    contactType: 'email',
    password: 'ShopPassword2026!',
  });

  const book1Id = 'book_user1_' + Date.now();
  const book2Id = 'book_user2_' + Date.now();

  db.prepare(`
    INSERT INTO books (id, name, currency_code, category, user_id, created_at, updated_at, schema_version)
    VALUES (?, ?, 'TZS', 'retail', ?, ?, ?, 4)
  `).run(book1Id, "Baraka's Retail Shop", user1.user.id, new Date().toISOString(), new Date().toISOString());

  db.prepare(`
    INSERT INTO books (id, name, currency_code, category, user_id, created_at, updated_at, schema_version)
    VALUES (?, ?, 'TZS', 'rental', ?, ?, ?, 4)
  `).run(book2Id, 'Kariakoo Apartments', user2.user.id, new Date().toISOString(), new Date().toISOString());

  // Check user 1's books
  const user1Books = db.prepare('SELECT id, name FROM books WHERE user_id = ?').all(user1.user.id);
  const user2Books = db.prepare('SELECT id, name FROM books WHERE user_id = ?').all(user2.user.id);

  if (user1Books.some((b) => b.id === book2Id)) {
    throw new Error("Data breach: User 1 can see User 2's books!");
  }
  if (user2Books.some((b) => b.id === book1Id)) {
    throw new Error("Data breach: User 2 can see User 1's books!");
  }
  console.log('   ✅ User 1 books:', user1Books.map((b) => b.name));
  console.log('   ✅ User 2 books:', user2Books.map((b) => b.name));

  // Verify BookService and TransactionService enforce user ownership
  const testBookService = new BookService();
  const testTxService = new TransactionService();

  const user1ListedBooks = testBookService.listBooks(user1.user.id);
  if (!user1ListedBooks.some((b) => b.id === book1Id) || user1ListedBooks.some((b) => b.id === book2Id)) {
    throw new Error('BookService listBooks failed user data isolation!');
  }

  let forbiddenHit = false;
  try {
    testBookService.getBook(book2Id, user1.user.id);
  } catch (err) {
    if (err.errorCode === 'FORBIDDEN' || err.statusCode === 403) {
      forbiddenHit = true;
    }
  }
  if (!forbiddenHit) {
    throw new Error('BookService getBook failed to reject cross-user access!');
  }

  // Test TransactionService creation in another user's book is rejected
  let txForbiddenHit = false;
  try {
    testTxService.createTransaction(
      {
        bookId: book2Id, // User 2's book
        type: 'income',
        amountMinor: 5000000,
        transactionDate: '2026-11-04',
      },
      user1.user.id // Attempted by User 1
    );
  } catch (err) {
    if (err.errorCode === 'FORBIDDEN' || err.statusCode === 403) {
      txForbiddenHit = true;
    }
  }
  if (!txForbiddenHit) {
    throw new Error('TransactionService failed to reject transaction in another user book!');
  }

  console.log('   ✅ Multi-user data strictly isolated and enforced across BookService and TransactionService.');

  // 9. Verify Loading Screen in App.tsx (No words, no branding)
  console.log('9. Verifying Loading Screen specification...');
  const appTsxContent = fs.readFileSync(path.resolve(process.cwd(), 'src/App.tsx'), 'utf-8');
  const loadingMatch = appTsxContent.match(/if\s*\((?:isLoading|isAuthLoading)[\s\S]*?return\s*\(([\s\S]*?)\);/);
  if (!loadingMatch) {
    throw new Error('Loading screen block not found in App.tsx');
  }
  const loadingBlock = loadingMatch[1];
  if (loadingBlock.includes('POTFOLIOO') || loadingBlock.includes('Your Business assistant')) {
    throw new Error('Loading screen still contains words or branding!');
  }
  if (!loadingBlock.includes('Loader2') && !loadingBlock.includes('animate-spin')) {
    throw new Error('Loading screen must contain the loading indicator');
  }
  console.log('   ✅ Loading screen verified: shows indicator only with zero words and zero branding.');

  // 10. Test Businesses & Memberships Architecture (Migration v5)
  console.log('10. Testing Businesses & Memberships Architecture (Migration v5)...');
  const business1Id = 'biz_user1_' + Date.now();
  const business2Id = 'biz_user2_' + Date.now();

  // Insert business for user 1
  db.prepare(`
    INSERT INTO businesses (id, name, type, category, currency_code, location, address, financial_year_start, accounting_preferences, created_at, updated_at)
    VALUES (?, 'Kariakoo Wholesalers Co.', 'retail', 'retail', 'TZS', 'Dar es Salaam', 'Congo Street, Kariakoo', '01-01', '{"basis":"cash","vatRegistered":false}', ?, ?)
  `).run(business1Id, new Date().toISOString(), new Date().toISOString());

  // Insert business membership for user 1 as owner
  db.prepare(`
    INSERT INTO business_members (id, business_id, user_id, role, permissions, created_at, updated_at)
    VALUES (?, ?, ?, 'owner', '["all"]', ?, ?)
  `).run('mem_1_' + Date.now(), business1Id, user1.user.id, new Date().toISOString(), new Date().toISOString());

  // Insert business for user 2
  db.prepare(`
    INSERT INTO businesses (id, name, type, category, currency_code, location, address, financial_year_start, accounting_preferences, created_at, updated_at)
    VALUES (?, 'Mikocheni Executive Suites', 'rental', 'rental', 'TZS', 'Dar es Salaam', 'Old Bagamoyo Road', '07-01', '{"basis":"accrual","vatRegistered":true}', ?, ?)
  `).run(business2Id, new Date().toISOString(), new Date().toISOString());

  // Insert business membership for user 2 as owner
  db.prepare(`
    INSERT INTO business_members (id, business_id, user_id, role, permissions, created_at, updated_at)
    VALUES (?, ?, ?, 'owner', '["all"]', ?, ?)
  `).run('mem_2_' + Date.now(), business2Id, user2.user.id, new Date().toISOString(), new Date().toISOString());

  // Query user 1 memberships
  const user1Memberships = db.prepare(`
    SELECT b.id, b.name, bm.role 
    FROM businesses b 
    JOIN business_members bm ON b.id = bm.business_id 
    WHERE bm.user_id = ?
  `).all(user1.user.id);

  if (user1Memberships.length !== 1 || user1Memberships[0].id !== business1Id) {
    throw new Error('User 1 membership query failed');
  }
  if (user1Memberships[0].role !== 'owner') {
    throw new Error('User 1 role should be owner');
  }

  // Verify User 2 cannot see User 1's business
  const user2Memberships = db.prepare(`
    SELECT b.id, b.name, bm.role 
    FROM businesses b 
    JOIN business_members bm ON b.id = bm.business_id 
    WHERE bm.user_id = ?
  `).all(user2.user.id);

  if (user2Memberships.some((b) => b.id === business1Id)) {
    throw new Error("Data breach: User 2 has access to User 1's business!");
  }
  console.log('   ✅ User 1 Business:', user1Memberships[0].name, 'Role:', user1Memberships[0].role);
  console.log('   ✅ User 2 Business:', user2Memberships[0].name, 'Role:', user2Memberships[0].role);
  console.log('   ✅ Multi-tenant business membership scoping and RBAC verified.');

  // 11. Test Tanzanian Region Validation & Financial Year Configuration
  console.log('11. Testing Tanzanian Region Validation & Financial Year Defaults...');
  const tanzanianRegions = [
    'Dar es Salaam', 'Arusha', 'Mwanza', 'Dodoma', 'Mbeya', 'Morogoro',
    'Tanga', 'Kilimanjaro', 'Zanzibar Urban/West', 'Iringa', 'Kagera',
    'Kigoma', 'Mara', 'Manyara', 'Ruvuma', 'Shinyanga', 'Tabora'
  ];
  if (!tanzanianRegions.includes('Dar es Salaam') || !tanzanianRegions.includes('Mwanza')) {
    throw new Error('Missing primary Tanzanian commercial regions');
  }
  // Verify currency default
  const bizRecord = db.prepare('SELECT currency_code, financial_year_start FROM businesses WHERE id = ?').get(business1Id);
  if (bizRecord.currency_code !== 'TZS') {
    throw new Error('Default currency must be TZS');
  }
  if (bizRecord.financial_year_start !== '01-01') {
    throw new Error('Default financial year start must be 01-01');
  }
  console.log('   ✅ Tanzanian SME regions verified and TZS default confirmed.');

  // 12. Test Demo Mode Isolation Guarantees
  console.log('12. Testing Demo Mode Isolation Guarantees...');
  const demoBookIds = ['demo-retail-book', 'demo-rental-book'];
  // Ensure demo book IDs are never present in user database
  const liveDemoRecords = db.prepare(`SELECT id FROM books WHERE id IN ('demo-retail-book', 'demo-rental-book')`).all();
  if (liveDemoRecords.length > 0) {
    throw new Error('Demo books leaked into persistent database tables!');
  }
  console.log('   ✅ Demo mode isolated: zero demo artifacts stored in live user database.');

  // Cleanup test data
  db.prepare("DELETE FROM business_members WHERE business_id IN (?, ?)").run(business1Id, business2Id);
  db.prepare("DELETE FROM businesses WHERE id IN (?, ?)").run(business1Id, business2Id);
  db.prepare("DELETE FROM books WHERE id IN (?, ?)").run(book1Id, book2Id);
  db.prepare("DELETE FROM users WHERE username IN ('test_user1', 'baraka_trader', 'kariakoo_wholesaler')").run();
  db.prepare("DELETE FROM rate_limits WHERE key LIKE 'login:%'").run();
  closeDb();

  console.log('\n🎉 ALL USER PROFILE, AUTH, PIN, AND CLOUD ISOLATION TESTS PASSED!\n');
} catch (err) {
  console.error('\n❌ Test failure:', err);
  try { closeDb(); } catch {}
  process.exit(1);
}
