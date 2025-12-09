import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { launch, injectOnly, isWindowOpen, close, getSatelliteWindow } from './launcher';

describe('Launcher', () => {
  let mockWindow: any;
  
  beforeEach(() => {
    // Mock window.open
    mockWindow = {
      closed: false,
      focus: vi.fn(),
      close: vi.fn(),
    };
    
    vi.stubGlobal('open', vi.fn(() => mockWindow));
  });
  
  afterEach(() => {
    close();
    vi.unstubAllGlobals();
  });
  
  describe('launch', () => {
    it('should open satellite window with default options', () => {
      launch();
      
      expect(window.open).toHaveBeenCalledWith(
        './dist/satellite-window.html',
        'SatelliteConsole',
        expect.stringContaining('width=800')
      );
      expect(isWindowOpen()).toBe(true);
    });
    
    it('should open satellite window with custom options', () => {
      launch({ width: 1000, height: 800 });
      
      expect(window.open).toHaveBeenCalledWith(
        './dist/satellite-window.html',
        'SatelliteConsole',
        expect.stringContaining('width=1000')
      );
    });
    
    it('should use custom satellite URL', () => {
      launch({ satelliteUrl: '/custom/path.html' });
      
      expect(window.open).toHaveBeenCalledWith(
        '/custom/path.html',
        'SatelliteConsole',
        expect.any(String)
      );
    });
    
    it('should focus existing window if already open', () => {
      launch();
      const firstWindow = getSatelliteWindow();
      
      launch();
      
      expect(firstWindow?.focus).toHaveBeenCalled();
      expect(window.open).toHaveBeenCalledTimes(1);
    });
    
    it('should handle window open failure gracefully', () => {
      vi.stubGlobal('open', vi.fn(() => null));
      
      expect(() => launch()).not.toThrow();
      expect(isWindowOpen()).toBe(false);
    });
  });
  
  describe('isWindowOpen', () => {
    it('should return false when no window is open', () => {
      expect(isWindowOpen()).toBe(false);
    });
    
    it('should return true when window is open', () => {
      launch();
      expect(isWindowOpen()).toBe(true);
    });
    
    it('should return false when window is closed', () => {
      launch();
      mockWindow.closed = true;
      expect(isWindowOpen()).toBe(false);
    });
  });
  
  describe('close', () => {
    it('should close the satellite window', () => {
      launch();
      const satelliteWindow = getSatelliteWindow();
      
      close();
      
      expect(satelliteWindow?.close).toHaveBeenCalled();
      expect(isWindowOpen()).toBe(false);
    });
    
    it('should handle closing when no window is open', () => {
      expect(() => close()).not.toThrow();
    });
  });
  
  describe('injectOnly', () => {
    it('should not throw error when called', () => {
      expect(() => injectOnly()).not.toThrow();
    });
    
    it('should accept custom pageId', () => {
      expect(() => injectOnly('custom-page-id')).not.toThrow();
    });
  });
});
