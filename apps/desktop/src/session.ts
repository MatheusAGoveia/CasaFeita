/*
 * Adapted from SweetHomeJS apps/web/src/App.tsx.
 * Sweet Home 3D Copyright (c) 2024 Space Mushrooms.
 * SweetHomeJS Copyright (c) 2026 SweetHomeJS contributors.
 * CasaFeita modifications Copyright (c) 2026 CasaFeita contributors.
 * GPL-2.0-or-later.
 */
import { Home, HomeController, Room, UserPreferences, Wall } from "@sweethomejs/core";
import { HomeViewAdapter } from "@sweethomejs/ui";

export interface Session {
  home: Home;
  preferences: UserPreferences;
  controller: HomeController;
}

export function createSession(home: Home): Session {
  const preferences = new UserPreferences();
  const homeView = new HomeViewAdapter();
  const controller = new HomeController(home, preferences, {
    createHomeView: () => homeView,
    createFurnitureView: () => ({}) as never,
    createFurnitureCatalogView: () => ({}) as never,
    createPlanView: () => ({}) as never,
    createView3D: () => ({}) as never,
    createWizardView: () => ({}) as never,
    createBackgroundImageWizardStepsView: () => ({}) as never,
    createImportedFurnitureWizardStepsView: () => ({}) as never,
    createImportedTextureWizardStepsView: () => ({}) as never,
    createThreadedTaskView: () => ({}) as never,
    createUserPreferencesView: () => ({}) as never,
    createLevelView: () => ({}) as never,
    createHomeFurnitureView: () => ({}) as never,
    createWallView: () => ({}) as never,
    createRoomView: () => ({}) as never,
    createPolylineView: () => ({}) as never,
    createDimensionLineView: () => ({}) as never,
    createLabelView: () => ({}) as never,
    createCompassView: () => ({}) as never,
    createObserverCameraView: () => ({}) as never,
    createHome3DAttributesView: () => ({}) as never,
    createTextureChoiceView: () => ({}) as never,
    createBaseboardChoiceView: () => ({}) as never,
    createModelMaterialsView: () => ({}) as never,
    createPageSetupView: () => ({}) as never,
    createPrintPreviewView: () => ({}) as never,
    createPhotoView: () => ({}) as never,
    createPhotosView: () => ({}) as never,
    createVideoView: () => ({}) as never,
    createHelpView: () => ({}) as never,
  } as never);
  return { home, preferences, controller };
}

export function createStarterHome(): Home {
  const home = new Home();
  home.setName("Casa de exemplo");
  home.getEnvironment().setGroundColor(0xd7ded6);

  const addWall = (x1: number, y1: number, x2: number, y2: number, thickness = 18): void => {
    const wall = new Wall(x1, y1, x2, y2, thickness, 265);
    wall.setLeftSideColor(0xf4f0e8);
    wall.setRightSideColor(0xf4f0e8);
    home.addWall(wall);
  };
  addWall(0, 0, 860, 0);
  addWall(860, 0, 860, 560);
  addWall(860, 560, 0, 560);
  addWall(0, 560, 0, 0);
  addWall(360, 0, 360, 240, 15);
  addWall(360, 330, 360, 560, 15);

  const living = new Room([[8, 8], [352, 8], [352, 552], [8, 552]]);
  living.setName("Sala de estar");
  living.setFloorColor(0xdac8b3);
  living.setAreaVisible(true);
  home.addRoom(living);

  const bedroom = new Room([[368, 8], [852, 8], [852, 552], [368, 552]]);
  bedroom.setName("Quarto");
  bedroom.setFloorColor(0xe6d7c6);
  bedroom.setAreaVisible(true);
  home.addRoom(bedroom);
  home.setModified(false);
  return home;
}
