import * as Options from '#internal/Options';
import { MStruct } from '@mjljm/effect-lib';

export interface Type extends Required<Options.Type> {
	readonly objectMarksLength: number;
	readonly arrayMarksLength: number;
}

export const make = MStruct.make<Type>;
