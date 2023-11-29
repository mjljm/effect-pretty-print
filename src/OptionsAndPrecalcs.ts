import * as Options from '#mjljm/effect-pretty-print/Options';
import { MFunction } from '@mjljm/effect-lib';

export interface Type extends Required<Options.Type> {
	readonly objectMarksLength: number;
	readonly arrayMarksLength: number;
}

export const make = MFunction.makeReadonly<Type>;
