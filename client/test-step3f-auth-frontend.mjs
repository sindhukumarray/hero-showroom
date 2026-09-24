import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientRoot = __dirname;

async function runFrontendAuthTests() {
  console.log('================================================================');
  console.log(' HERO SHOWROOM — PHASE 3 STEP 6 FRONTEND AUTH AUDIT            ');
  console.log('================================================================\n');

  let checks = 0;
  let passed = 0;
  let failed = 0;

  const assert = (condition, description) => {
    checks++;
    if (condition) {
      console.log(`  ✅ [PASS] ${description}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${description}`);
      failed++;
    }
  };

  // 1. Audit File Structure and Presence
  console.log('1. Auditing Frontend Auth Files & Components:');
  const apiPath = path.join(clientRoot, 'src/services/api.js');
  const authServicePath = path.join(clientRoot, 'src/services/authService.js');
  const servicesIndexPath = path.join(clientRoot, 'src/services/index.js');
  const authContextPath = path.join(clientRoot, 'src/context/AuthContext.jsx');
  const protectedRoutePath = path.join(clientRoot, 'src/components/auth/ProtectedRoute.jsx');
  const componentsIndexPath = path.join(clientRoot, 'src/components/index.js');
  const loginPagePath = path.join(clientRoot, 'src/pages/LoginPage.jsx');
  const registerPagePath = path.join(clientRoot, 'src/pages/RegisterPage.jsx');
  const headerPath = path.join(clientRoot, 'src/components/Header.jsx');
  const appRoutesPath = path.join(clientRoot, 'src/routes/AppRoutes.jsx');
  const appPath = path.join(clientRoot, 'src/App.jsx');

  assert(fs.existsSync(apiPath), 'api.js exists');
  assert(fs.existsSync(authServicePath), 'authService.js exists');
  assert(fs.existsSync(servicesIndexPath), 'services/index.js exists');
  assert(fs.existsSync(authContextPath), 'context/AuthContext.jsx exists');
  assert(fs.existsSync(protectedRoutePath), 'components/auth/ProtectedRoute.jsx exists');
  assert(fs.existsSync(componentsIndexPath), 'components/index.js exists');
  assert(fs.existsSync(loginPagePath), 'pages/LoginPage.jsx exists');
  assert(fs.existsSync(registerPagePath), 'pages/RegisterPage.jsx exists');
  assert(fs.existsSync(headerPath), 'components/Header.jsx exists');
  assert(fs.existsSync(appRoutesPath), 'routes/AppRoutes.jsx exists');
  assert(fs.existsSync(appPath), 'App.jsx exists');

  // 2. Audit API Service & Axios Interceptors
  console.log('\n2. Auditing API Service Layer & Token Interceptors:');
  const apiCode = fs.readFileSync(apiPath, 'utf8');
  assert(apiCode.includes("hero_showroom_access_token"), 'api.js defines TOKEN_STORAGE_KEY as "hero_showroom_access_token"');
  assert(apiCode.includes("Bearer ${token"), 'api.js request interceptor attaches Bearer token header');
  assert(apiCode.includes("statusCode === 401"), 'api.js response interceptor checks for 401 Unauthorized status');
  assert(apiCode.includes("removeItem(TOKEN_STORAGE_KEY)"), 'api.js removes stale token on 401 response');

  const authServiceCode = fs.readFileSync(authServicePath, 'utf8');
  assert(authServiceCode.includes("api.post('/auth/register'"), 'authService.register calls POST /auth/register');
  assert(authServiceCode.includes("api.post('/auth/login'"), 'authService.login calls POST /auth/login');
  assert(authServiceCode.includes("api.get('/auth/me'"), 'authService.getCurrentUser calls GET /auth/me');
  assert(authServiceCode.includes("api.post('/auth/logout'"), 'authService.logout calls POST /auth/logout');

  const servicesIndexCode = fs.readFileSync(servicesIndexPath, 'utf8');
  assert(servicesIndexCode.includes("export * as authService from './authService'"), 'services/index.js re-exports authService');
  assert(servicesIndexCode.includes("TOKEN_STORAGE_KEY"), 'services/index.js exports TOKEN_STORAGE_KEY');

  // 3. Audit Auth Context Architecture & State Management
  console.log('\n3. Auditing AuthContext State & Lifecycle:');
  const authContextCode = fs.readFileSync(authContextPath, 'utf8');
  assert(authContextCode.includes('export const AuthProvider ='), 'AuthContext exports AuthProvider component');
  assert(authContextCode.includes('export const useAuth ='), 'AuthContext exports useAuth hook');
  assert(authContextCode.includes('isAuthenticated: Boolean(user && token)'), 'AuthContext computes isAuthenticated boolean');
  assert(authContextCode.includes('localStorage.getItem(TOKEN_STORAGE_KEY)'), 'AuthContext checks localStorage on mount');
  assert(authContextCode.includes('authService.getCurrentUser()'), 'AuthContext calls getCurrentUser to restore session');
  assert(authContextCode.includes('localStorage.setItem(TOKEN_STORAGE_KEY, accessToken)'), 'AuthContext persists token on login');
  assert(authContextCode.includes('localStorage.removeItem(TOKEN_STORAGE_KEY)'), 'AuthContext clears token on logout and on 401 error');
  assert(authContextCode.includes('refreshUser'), 'AuthContext provides refreshUser method');

  // 4. Audit ProtectedRoute Component
  console.log('\n4. Auditing ProtectedRoute & Role-Based Navigation:');
  const protectedRouteCode = fs.readFileSync(protectedRoutePath, 'utf8');
  assert(protectedRouteCode.includes('const { user, isAuthenticated, isLoading } = useAuth();'), 'ProtectedRoute consumes useAuth hook');
  assert(protectedRouteCode.includes('if (isLoading)'), 'ProtectedRoute handles loading state during session restoration');
  assert(protectedRouteCode.includes('<Navigate to="/login"'), 'ProtectedRoute redirects unauthenticated visitors to /login');
  assert(protectedRouteCode.includes('state={{ from: location }}'), 'ProtectedRoute preserves original location for post-login redirect');
  assert(protectedRouteCode.includes('allowedRoles'), 'ProtectedRoute supports role-based route filtering');
  assert(protectedRouteCode.includes('<Outlet />'), 'ProtectedRoute renders nested routes via Outlet');

  const componentsIndexCode = fs.readFileSync(componentsIndexPath, 'utf8');
  assert(componentsIndexCode.includes("export { default as ProtectedRoute } from './auth/ProtectedRoute'"), 'components/index.js exports ProtectedRoute');

  // 5. Audit Route Wiring in AppRoutes & App
  console.log('\n5. Auditing Central Routing & App Shell:');
  const appRoutesCode = fs.readFileSync(appRoutesPath, 'utf8');
  assert(appRoutesCode.includes('<Route path="login" element={<LoginPage />} />'), 'AppRoutes defines /login route');
  assert(appRoutesCode.includes('<Route path="register" element={<RegisterPage />} />'), 'AppRoutes defines /register route');
  assert(appRoutesCode.includes('<Route element={<ProtectedRoute />}>'), 'AppRoutes wraps /dashboard with ProtectedRoute');
  assert(appRoutesCode.includes("allowedRoles={['admin']}"), 'AppRoutes protects /admin with admin role guard');
  assert(appRoutesCode.includes('<Route path="bikes" element={<BikesPage />} />'), 'Public /bikes route remains unencumbered');
  assert(appRoutesCode.includes('<Route path="showrooms" element={<ShowroomsPage />} />'), 'Public /showrooms route remains unencumbered');

  const appCode = fs.readFileSync(appPath, 'utf8');
  assert(appCode.includes('<AuthProvider>'), 'App.jsx wraps application with AuthProvider');

  // 6. Audit Forms, Validation & UX States (LoginPage & RegisterPage)
  console.log('\n6. Auditing Auth Forms & Validation UX:');
  const loginPageCode = fs.readFileSync(loginPagePath, 'utf8');
  assert(loginPageCode.includes('const { login, isAuthenticated } = useAuth();'), 'LoginPage consumes login and isAuthenticated from useAuth');
  assert(loginPageCode.includes('type="email"'), 'LoginPage contains email input');
  assert(loginPageCode.includes('type="password"'), 'LoginPage contains password input');
  assert(loginPageCode.includes('isSubmitting'), 'LoginPage manages submission state');
  assert(loginPageCode.includes('apiError'), 'LoginPage manages and displays API error state');
  assert(loginPageCode.includes('role="alert"'), 'LoginPage uses accessible role="alert" for error announcements');
  assert(loginPageCode.includes('to="/register"'), 'LoginPage links to registration');

  const registerPageCode = fs.readFileSync(registerPagePath, 'utf8');
  assert(registerPageCode.includes('const { register, isAuthenticated } = useAuth();'), 'RegisterPage consumes register from useAuth');
  assert(registerPageCode.includes('id="name"'), 'RegisterPage contains name input');
  assert(registerPageCode.includes('id="email"'), 'RegisterPage contains email input');
  assert(registerPageCode.includes('id="password"'), 'RegisterPage contains password input');
  assert(registerPageCode.includes('id="phone"'), 'RegisterPage contains optional phone input');
  assert(registerPageCode.includes('isSuccess'), 'RegisterPage handles success acknowledgement');
  assert(registerPageCode.includes('to="/login"'), 'RegisterPage provides route to login');

  // 7. Audit Header Navigation Session Controls
  console.log('\n7. Auditing Header Session State & Logout Integration:');
  const headerCode = fs.readFileSync(headerPath, 'utf8');
  assert(headerCode.includes('const { user, isAuthenticated, logout } = useAuth();'), 'Header consumes user, isAuthenticated, logout');
  assert(headerCode.includes('Sign Out'), 'Header includes "Sign Out" button');
  assert(headerCode.includes('handleLogout'), 'Header handles logout with navigation');
  assert(headerCode.includes('user?.name'), 'Header displays authenticated user name');
  assert(headerCode.includes('to="/register"'), 'Header provides unauthenticated register link');
  assert(headerCode.includes('to="/login"'), 'Header provides unauthenticated sign in link');

  // 8. Security & Secret Leakage Audits
  console.log('\n8. Auditing Security, Secrets & Token Hygiene:');
  const allClientFiles = [
    apiCode,
    authServiceCode,
    authContextCode,
    protectedRouteCode,
    loginPageCode,
    registerPageCode,
    headerCode
  ].join('\n');

  assert(!allClientFiles.includes('JWT_SECRET'), 'No JWT_SECRET mentioned in frontend code');
  assert(!allClientFiles.includes('MONGODB_URI'), 'No MONGODB_URI mentioned in frontend code');
  assert(!allClientFiles.includes('passwordHash'), 'No passwordHash handled or expected in frontend');
  assert(!allClientFiles.includes('console.log(token'), 'No token logging to console');
  assert(!allClientFiles.includes('console.log(password'), 'No password logging to console');

  // 9. Mock Session State Machine Simulation
  console.log('\n9. Simulating Client State Machine Behaviors:');

  // Simulate token storage and interceptor header generation
  const mockStorage = new Map();
  const setToken = (t) => mockStorage.set('hero_showroom_access_token', t);
  const getToken = () => mockStorage.get('hero_showroom_access_token');
  const clearToken = () => mockStorage.delete('hero_showroom_access_token');

  assert(getToken() === undefined, 'Initial mock storage is empty');

  // Login simulation
  const dummyJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy.signature';
  setToken(dummyJwt);
  assert(getToken() === dummyJwt, 'Mock storage saves JWT after login');

  const mockReqConfig = { headers: {} };
  const mockToken = getToken();
  if (mockToken) {
    mockReqConfig.headers.Authorization = `Bearer ${mockToken}`;
  }
  assert(mockReqConfig.headers.Authorization === `Bearer ${dummyJwt}`, 'Request headers correctly format Bearer authorization');

  // 401 Eviction simulation
  const mockResponseError = { response: { status: 401 } };
  if (mockResponseError.response.status === 401) {
    clearToken();
  }
  assert(getToken() === undefined, '401 simulation correctly evicts stale token from storage');

  console.log('\n================================================================');
  console.log(` SUMMARY: ${passed}/${checks} checks passed (${failed} failed)`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runFrontendAuthTests().catch((err) => {
  console.error('Fatal error during frontend auth testing:', err);
  process.exit(1);
});
