const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Define workspace root and packages paths
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");
const packagesPath = path.resolve(workspaceRoot, "packages");

// Watch all files in the workspace
config.watchFolders = [workspaceRoot];

// Enable symlink resolution for pnpm workspaces
config.resolver.unstable_enableSymlinks = true;

// Map workspace packages to their source directories
config.resolver.alias = {
  "@camp/convex": path.resolve(packagesPath, "convex"),
  "@camp/shared": path.resolve(packagesPath, "shared"),
  "@camp/ui": path.resolve(packagesPath, "ui"),
  "@camp/config": path.resolve(packagesPath, "config"),
  xlsx: require.resolve("xlsx"),
};

// Include workspace packages in Metro's module resolution
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// Ensure we can resolve all necessary extensions
config.resolver.sourceExts = [
  ...config.resolver.sourceExts,
  "js",
  "json",
  "ts",
  "tsx",
  "jsx",
];

// Prioritize react-native over browser
config.resolver.resolverMainFields = ["react-native", "browser", "main"];

module.exports = config;
