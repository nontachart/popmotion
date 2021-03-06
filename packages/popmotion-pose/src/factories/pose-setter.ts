import { Action } from 'popmotion/action';
import chain from 'popmotion/compositors/chain';
import delayAction from 'popmotion/compositors/delay';
import { flipPose, isFlipPose } from '../dom/flip';
import { just } from '../inc/default-transitions';
import { Pose, Poser, PoseSetter, PoseSetterFactoryProps, ChildPoses, Bounds2D, PoseSetterProps } from '../types';
import { getPoseValues } from 'inc/selectors';

export type PoseSetterFactory = (props: PoseSetterFactoryProps) => PoseSetter;

type EnforceBoundary = (v: number) => number;
type AnimationsPromiseList = Array<Promise<any>>;

type BoundaryMap = {
  [key: string]: [string, string]
};

const boundaryMap: BoundaryMap = {
  x: ['left', 'right'],
  y: ['top', 'bottom'],
  z: ['far', 'near']
};

const addBoundaries = (action: Action, bounds: Bounds2D, key: string): Action => {
  const enforceBounds: EnforceBoundary[] = [];
  const [min, max] = boundaryMap[key];

  if (bounds[min] !== undefined) enforceBounds.push((v: number) => Math.max(v, bounds[min]));
  if (bounds[max] !== undefined) enforceBounds.push((v: number) => Math.min(v, bounds[max]));

  return enforceBounds.length ? action.pipe(...enforceBounds) : action;
};

const dragPoses = new Set(['dragging', 'dragEnd']);

const startChildAnimations = (children: ChildPoses, next: string, nextPose: Pose, props: PoseSetterProps): Array<Promise<any>> => {
  const animations: Array<Promise<any>> = [];
  let delay = 0;
  let stagger = 0;
  let staggerDirection = 1;

  if (nextPose) {
    delay = nextPose.delayChildren || delay;
    stagger = nextPose.staggerChildren || stagger;
    staggerDirection = nextPose.staggerDirection || staggerDirection;
  }

  const maxStaggerDuration = children.size - 1 * stagger;
  const generateStaggerDuration = staggerDirection === 1
    ? (i: number) => i * stagger
    : (i: number) => maxStaggerDuration - (i * stagger);

  Array.from(children).forEach((child: Poser, i: number) => {
    animations.push(child.set(next, {
      ...props,
      delay: delay + generateStaggerDuration(i)
    }))
  });

  return animations;
};

const createPoseSetter: PoseSetterFactory = (setterProps) => (next, props = {}) => {
  const { delay = 0 } = props;
  const { activeActions, activePoses, children, poses, values, types, dragProps } = setterProps;
  const animations: AnimationsPromiseList = [];
  const { dragBounds } = dragProps;
  let nextPose = poses[next];

  if (nextPose) {
    if (isFlipPose(nextPose, next)) nextPose = flipPose(setterProps, nextPose);
    const { transition: getTransition } = nextPose;

    const poserAnimations = Object.keys(getPoseValues(nextPose)).map(
      (key) => new Promise((complete) => {
        const value = values.get(key);
        const type = types.get(key);
        const from = value.get();
        const unparsedTarget = nextPose[key];

        // Stop the current action
        if (activeActions.has(key)) activeActions.get(key).stop();

        // Get transition if `transition` prop isn't false
        let transition = getTransition({
          ...props,
          from: type ? type.parse(from) : from,
          velocity: value.getVelocity() || 0,
          to: type ? type.parse(unparsedTarget) : unparsedTarget,
          key,
          prevPoseKey: activePoses.get(key)
        });

        if (transition === false) transition = just(unparsedTarget);

        // If this is a drag pose, apply boundaries
        if (dragPoses.has(next) && dragBounds && boundaryMap[key]) transition = addBoundaries(transition, dragBounds, key);

        // Add delay if defined
        if (delay || nextPose.delay) {
          transition = chain(
            delayAction(delay || nextPose.delay),
            transition
          );
        }

        // Start transition
        const transitionApi = transition.start({
          update: (v: any) => value.update(v),
          complete
        });

        activeActions.set(key, transitionApi);
        activePoses.set(key, next);
      })
    );

    animations.push(...poserAnimations);
  }

  // Get children animation Promises
  if (children.size) animations.push(...startChildAnimations(children, next, nextPose, props));

  return Promise.all(animations);
};

export default createPoseSetter;
