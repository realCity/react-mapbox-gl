jest.mock('mapbox-gl', () => ({
  default: {},
  LngLat: {}
}));

import { overlayTransform, OverlayParams, anchors } from '../util/overlays';

describe('overlayTransform', () => {
  it('Should transform position anchor and offset accordingly', () => {
    const overlayProps: OverlayParams = {
      anchor: anchors[1],
      // tslint:disable-next-line:no-any
      offset: { x: 10, y: 20 } as any,
      // tslint:disable-next-line:no-any
      position: { x: 1000, y: 2000 } as any
    };

    const res = overlayTransform(overlayProps);

    expect(res).toEqual({
      top: 2020,
      left: 1010,
      transform: 'translate(-50%, 0)'
    });
  });

  it('Should transform position and offset only', () => {
    // tslint:disable-next-line:no-any
    const overlayProps: any = {
      offset: { x: 10, y: 20 },
      position: { x: 1000, y: 2000 }
    };

    const res = overlayTransform(overlayProps);

    expect(res).toEqual({
      left: 1010,
      top: 2020,
      transform: 'translate(0, 0)'
    });
  });

  it('Should not add an undefined offset', () => {
    // tslint:disable-next-line:no-any
    const overlayProps: any = {
      offset: { x: undefined, y: 20 },
      position: { x: 1000, y: 2000 }
    };

    const res = overlayTransform(overlayProps);

    expect(res).toEqual({
      left: 1000,
      top: 2000,
      transform: 'translate(0, 0)'
    });
  });

  it('Should add offset of 0', () => {
    // tslint:disable-next-line:no-any
    const overlayProps: any = {
      offset: { x: 0, y: 20 },
      position: { x: 1000, y: 2000 }
    };

    const res = overlayTransform(overlayProps);

    expect(res).toEqual({
      left: 1000,
      top: 2020,
      transform: 'translate(0, 0)'
    });
  });
});
