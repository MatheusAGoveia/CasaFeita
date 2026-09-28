module.exports = {
  packagerConfig: {
    name: "CasaFeita",
    executableName: "CasaFeita",
    asar: true,
  },
  makers: [
    {
      name: "@electron-forge/maker-squirrel",
      config: { name: "CasaFeita", authors: "CasaFeita contributors" },
    },
    { name: "@electron-forge/maker-zip", platforms: ["win32"] },
  ],
};
