import * as MStruct from '@mjljm/effect-data-lib/effect/Struct';
import * as Options from '@mjljm/effect-pretty-print/Options';

export interface OptionsAndPrecalcs extends Required<Options.Options> {
	readonly objectMarksLength: number;
	readonly arrayMarksLength: number;
}

export const make = MStruct.make<OptionsAndPrecalcs>;
