import * as FormattedString from '#mjljm/effect-pretty-print/FormattedString';
import * as Options from '#mjljm/effect-pretty-print/Options';
import * as OptionsAndPrecalcs from '#mjljm/effect-pretty-print/OptionsAndPrecalcs';
import { GraphOrigin, MFunction } from '@mjljm/effect-lib';
import { Order, Stream } from 'effect';

const _ = Options._;

/**
 * Model
 */
export interface Property {
	readonly originalKey: string | symbol;
	readonly key: FormattedString.Type;
	readonly prefixedKey: FormattedString.Type;
	readonly value: MFunction.Unknown;
	readonly level: number;
}

/**
 * Orders
 */
export const byName = Order.mapInput(
	FormattedString.byValue,
	(p: Property) => p.key
);
export const byPrefixedName = Order.mapInput(
	FormattedString.byValue,
	(p: Property) => p.prefixedKey
);
export const byLevel = Order.mapInput(Order.number, (p: Property) => p.level);
export const byLevelAndName = Order.combine(byLevel, byName);

/**
 * Constructor
 */
export const make = MFunction.makeReadonly<Property>;

/**
 * Constructor
 */
export const makeFromObjectRecord = (
	input: MFunction.Record,
	options: OptionsAndPrecalcs.Type
) =>
	GraphOrigin.flatten(input, {
		handleSpecialNode: (a) => Option.none(),
		handleCircularNode: (a) => ''
	});
Stream.unfoldChunk;
/*pipe(
		// Read and filter all properties (own and inherited if requested)
		MFunction.whileDoAccum(
			MFORLoop<unknown>({
				input,
				protoChainLevel: 0,
				prefix: _('')
			}),
			{
				predicate: isObjectRecordMFORLoop,
				body: ({ input, prefix, protoChainLevel }) =>
					pipe(
						input,
						Reflect.ownKeys,
						ReadonlyArray.filterMap((key) =>
							pipe(
								options.keyFormatter(key),
								(formattedKey) =>
									Property.make({
										originalKey: key,
										key: formattedKey,
										prefixedKey: FormattedString.append(formattedKey)(prefix),
										value: input[key] as MFunction.Unknown,
										level: protoChainLevel
									}),
								(property) =>
									keepProperty(property, input, options)
										? Option.some(property)
										: Option.none()
							)
						)
					),
				step: ({ input, prefix, protoChainLevel }) =>
					MFORLoop<unknown>({
						input: options.showInherited
							? (Object.getPrototypeOf(input) as unknown)
							: null,
						protoChainLevel: protoChainLevel + 1,
						prefix: FormattedString.append(prefix)(options.prototypePrefix)
					})
			}
		),
		ReadonlyArray.flatten,
		// Sort as requested
		sort(options),
		(properties) =>
			make({
				startMark: options.objectStartMark,
				endMark: options.objectEndMark,
				objectPropertySeparator: options.objectPropertySeparator,
				separator: options.objectSeparator,
				properties,
				marksLength: options.objectMarksLength,
				sepsLength:
					options.objectPropertySeparator.printedLength +
					options.objectSeparator.printedLength
			})
	);*/
