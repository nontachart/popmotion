import { Action } from 'popmotion/action';
import { ColdSubscription } from 'popmotion/action/types';
import { ValueReaction } from 'popmotion/reactions/value';
import { ValueType } from 'style-value-types';
import { Styler } from 'stylefire';

export type Pose = {
  transition?: Transition,
  delay?: number,
  delayChildren?: number,
  staggerChildren?: number,
  staggerDirection?: 1 | -1,
  [key: string]: any
};

export type StateMap = {
  [key: string]: any
};

export interface Poser {
  set: (poseName: string, props?: PoseSetterProps) => Promise<any>;
  has: (poseName: string) => boolean;
  get: () => StateMap;
  measure: () => void;
  flip: (op: Function) => Promise<any>;
  addChild: (element: Element, props: PoserProps) => Poser;
  removeChild: (poser: Poser) => void;
  clearChildren: () => void;
  destroy: () => void;
}

export type PoserFactory = (element: Element, props: PoserProps) => Poser;

export type PoseMap = {
  [key: string]: Pose
};

export type Transformer = (v: any) => any;

export type PassiveMap = {
  [key: string]: [string, Transformer, boolean | undefined]
};

export type OnChangeMap = {
  [key: string]: Transformer
};

export type Bounds2D = {
  [key: string]: number
};

export interface Dimensions {
  get: () => BoundingBox;
  measure: () => void;
  has: () => boolean;
}

export type Draggable = boolean | 'x' | 'y';

export type PointerCallback = (e: MouseEvent | TouchEvent) => any;

export type PoserProps = {
  initialPose?: string,
  passive?: PassiveMap,
  onChange?: OnChangeMap,
  parentValues?: ValueMap,
  draggable?: Draggable
} & DragProps;

export type PropsAndPoses = PoserProps & PoseMap;

export type RawValue = string | number;

export type TransitionProps = {
  from: RawValue,
  velocity: RawValue,
  to: RawValue,
  key: string,
  prevPoseKey: string
};

export type Transition = (props: TransitionProps & PoseSetterProps) => Action | false;

export type ValueMap = Map<string, ValueReaction>;
export type TypesMap = Map<string, ValueType>;

export type ValuesFactoryProps = {
  poses: PoseMap,
  styler: Styler,
  initialPose: string,
  passive: PassiveMap,
  parentValues: ValueMap,
  onChange: OnChangeMap
};

export type ValuesAndTypes = {
  values: ValueMap,
  types: TypesMap
};

export type PoseSetterFactoryProps = {
  activeActions: ActiveActions,
  activePoses: ActivePoses,
  children: ChildPoses,
  dragProps: DragProps,
  values: ValueMap,
  types: TypesMap,
  poses: PoseMap,
  elementStyler: Styler,
  element: Element,
  dimensions: Dimensions
};

export type PoseSetterProps = {
  [key: string]: any,
  delay?: number
};

export type PoseSetter = (next: string, props?: PoseSetterProps) => Promise<any>;

export type ActiveActions = Map<string, ColdSubscription>;
export type ActivePoses = Map<string, string>;

export type ChildPoses = Set<Poser>;

export type DragProps = {
  dragBounds?: Bounds2D,
  onDragStart?: PointerCallback,
  onDragEnd?: PointerCallback
};

export type BoundingBox = {
  width: number,
  height: number,
  left: number,
  top: number,
  right: number,
  bottom: number
};
