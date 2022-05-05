export default {
   transform: {
      '^.+\\.js$': 'babel-jest',
   },
   testTimeout: 35000,
   maxWorkers: 1,
   projects: [
      {
         displayName: "unit tests",
         moduleFileExtensions: ['js'],
         transformIgnorePatterns: ['<rootDir>/node_modules/'],
      }
   ]
};