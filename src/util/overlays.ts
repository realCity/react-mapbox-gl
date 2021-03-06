import { LngLat, Point, Map } from 'mapbox-gl';
import { Props } from '../projected-layer';
import { Anchor, AnchorsOffset, OptionalOffset } from './types';

export interface PointDef {
  x: number;
  y: number;
}

export interface OverlayParams {
  anchor?: Anchor;
  offset?: Point;
  position?: Point;
}

export const anchors = [
  'center',
  'top',
  'bottom',
  'left',
  'right',
  'top-left',
  'top-right',
  'bottom-left',
  'bottom-right'
] as Anchor[];

export const anchorTranslates = {
  center: 'translate(-50%, -50%)',
  top: 'translate(-50%, 0)',
  left: 'translate(0, -50%)',
  right: 'translate(-100%, -50%)',
  bottom: 'translate(-50%, -100%)',
  'top-left': 'translate(0, 0)',
  'top-right': 'translate(-100%, 0)',
  'bottom-left': 'translate(0, -100%)',
  'bottom-right': 'translate(-100%, -100%)'
};

// Hack /o\
const defaultElement = { offsetWidth: 0, offsetHeight: 0 };
const defaultPoint = [0, 0];

const projectCoordinates = (map: Map, coordinates: number[]) =>
  map.project(LngLat.convert(coordinates));

const calculateAnchor = (
  map: Map,
  offsets: AnchorsOffset,
  position: PointDef,
  { offsetHeight, offsetWidth } = defaultElement,
  anchor?: Anchor,
  preferred?: boolean
) => {
  if (anchor && !preferred) {
    return anchor;
  }

  let result: string[] = [];

  const relativeOffsetHeight = offsetHeight * getVerticalOffsetRatio(anchor || 'bottom');

  if (position.y + offsets.bottom.y - relativeOffsetHeight < 0) {
    result = [anchors[1]];
  } else if (
    position.y + offsets.top.y + offsetHeight - relativeOffsetHeight >
    // tslint:disable-next-line:no-any
    (map as any).transform.height
  ) {
    result = [anchors[2]];
  } else if (anchor) {
    if (anchor.indexOf('top') === 0) {
      result = ['top'];
    } else if (anchor.indexOf('bottom') === 0) {
      result = ['bottom'];
    }
  }

  const relativeOffsetWidth = offsetWidth * getHorizontalOffsetRatio(anchor || 'center');

  if (position.x < relativeOffsetWidth) {
    result.push(anchors[3]);
    // tslint:disable-next-line:no-any
  } else if (position.x > (map as any).transform.width - offsetWidth + relativeOffsetWidth) {
    result.push(anchors[4]);
  } else if (anchor) {
    if (anchor.indexOf('left') !== -1) {
      result.push('left');
    } else if (anchor.indexOf('right') !== -1) {
      result.push('right');
    }
  }

  if (result.length === 0) {
    return anchors[2];
  }

  return result.join('-') as Anchor;
};

const getHorizontalOffsetRatio = (anchor: Anchor): number => {
  switch (anchor) {
    case 'center':
    case 'top':
    case 'bottom':
      return 0.5;
    case 'left':
    case 'top-left':
    case 'bottom-left':
      return 0;
    case 'right':
    case 'top-right':
    case 'bottom-right':
      return 1;
  }
};

const getVerticalOffsetRatio = (anchor: Anchor): number => {
  switch (anchor) {
    case 'center':
    case 'left':
    case 'right':
      return 0.5;
    case 'top':
    case 'top-left':
    case 'top-right':
      return 0;
    case 'bottom':
    case 'bottom-left':
    case 'bottom-right':
      return 1;
  }
};

const normalizedOffsets = (
  offset?: number | Point | OptionalOffset | number[]
): AnchorsOffset => {
  if (!offset) {
    return normalizedOffsets(new Point(0, 0));
  }

  if (typeof offset === 'number') {
    // input specifies a radius from which to calculate offsets at all positions
    const cornerOffset = Math.round(Math.sqrt(0.5 * Math.pow(offset, 2)));
    return {
      center: new Point(offset, offset),
      top: new Point(0, offset),
      bottom: new Point(0, -offset),
      left: new Point(offset, 0),
      right: new Point(-offset, 0),
      'top-left': new Point(cornerOffset, cornerOffset),
      'top-right': new Point(-cornerOffset, cornerOffset),
      'bottom-left': new Point(cornerOffset, -cornerOffset),
      'bottom-right': new Point(-cornerOffset, -cornerOffset)
    };
  }

  if (offset instanceof Point || Array.isArray(offset)) {
    // input specifies a single offset to be applied to all positions
    return anchors.reduce(
      (res, anchor) => {
        res[anchor] = Point.convert(offset);
        return res;
      },
      // tslint:disable-next-line:no-object-literal-type-assertion
      {} as AnchorsOffset
    );
  }

  // input specifies an offset per position
  return anchors.reduce(
    (res, anchor) => {
      res[anchor] = Point.convert(offset[anchor] || defaultPoint);
      return res;
    },
    // tslint:disable-next-line:no-object-literal-type-assertion
    {} as AnchorsOffset
  );
};

export const overlayState = (
  props: Props,
  map: Map,
  container: HTMLElement
) => {
  const position = projectCoordinates(map, props.coordinates);
  const offsets = normalizedOffsets(props.offset);
  const anchor = calculateAnchor(map, offsets, position, container, props.anchor, props.preferredAnchor);

  return {
    anchor,
    position,
    offset: offsets[anchor]
  };
};

export const overlayTransform = ({
  anchor,
  position,
  offset
}: OverlayParams): { left: number; top: number; transform: string } => {
  let left = 0;
  let top = 0;

  if (position) {
    left += position.x;
    top += position.y;
  }

  if (offset && offset.x !== undefined && offset.y !== undefined) {
    left += offset.x;
    top += offset.y;
  }

  return {
    top,
    left,
    transform: anchorTranslates[anchor || 'top-left']
  };
};
