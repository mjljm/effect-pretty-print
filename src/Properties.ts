import * as FormattedString from '#mjljm/effect-pretty-print/FormattedString';
import * as Options from '#mjljm/effect-pretty-print/Options';
import * as Property from '#mjljm/effect-pretty-print/Property';
import { MFunction } from '@mjljm/effect-lib';
import {
	Chunk,
	Function,
	Match,
	Option,
	ReadonlyArray,
	Tuple,
	pipe
} from 'effect';

export type Type = ReadonlyArray<Property.Type>;

export const fromArray = (input: MFunction.Array): Chunk.Chunk<Property.Type> =>
	pipe(
		input,
		Chunk.unsafeFromArray,
		Chunk.map((value) => Property.makeFromValue(value as MFunction.Unknown))
	);

export const fromRecord = (
	input: MFunction.Record,
	options: Required<Options.Type>
): Chunk.Chunk<Property.Type> =>
	pipe(
		ReadonlyArray.unfold(input, (previous) =>
			options.showInherited
				? pipe(Object.getPrototypeOf(previous) as unknown, (proto) =>
						MFunction.isRecord(proto)
							? Option.some(Tuple.make(previous, proto))
							: Option.none()
				  )
				: Option.none()
		),
		Chunk.unsafeFromArray,
		Chunk.prepend(input),
		Chunk.map((record, protoChainLevel) =>
			pipe(
				options.prototypePrefix,
				FormattedString.repeat(protoChainLevel),
				(prefix) =>
					pipe(
						record,
						Reflect.ownKeys,
						Chunk.unsafeFromArray,
						Chunk.filterMap((key) =>
							pipe(
								options.keyFormatter(key),
								(formattedKey) =>
									Property.make({
										originalKey: key,
										key: formattedKey,
										prefixedKey: FormattedString.concat(prefix, formattedKey),
										value: input[key] as MFunction.Unknown,
										level: protoChainLevel
									}),
								(property) =>
									keepProperty(property, input, options)
										? Option.some(property)
										: Option.none()
							)
						)
					)
			)
		),
		Chunk.flatten,
		// Sort as requested
		sort(options)
	);

const keepProperty = (
	property: Property.Type,
	obj: MFunction.Record,
	options: Required<Options.Type>
) =>
	Option.match(options.propertyPredicate(property), {
		onNone: () =>
			(!Function.isFunction(property.value) || options.showFunctions) &&
			pipe(
				Match.type<Options.stringOrSymbolPropertiesType>(),
				Match.when('string', () => typeof property.originalKey === 'string'),
				Match.when('symbol', () => typeof property.originalKey === 'symbol'),
				Match.when('both', () => true),
				Match.exhaustive
			)(options.stringOrSymbolProperties) &&
			pipe(
				Match.type<Options.enumerableOrNonEnumarablePropertiesType>(),
				Match.when('enumerable', () =>
					Object.prototype.propertyIsEnumerable.call(obj, property.originalKey)
				),
				Match.when(
					'nonEnumerable',
					() =>
						!Object.prototype.propertyIsEnumerable.call(
							obj,
							property.originalKey
						)
				),
				Match.when('both', () => true),
				Match.exhaustive
			)(options.enumerableOrNonEnumarableProperties),
		onSome: Function.identity
	});

const sort =
	(options: Required<Options.Type>) => (self: Chunk.Chunk<Property.Type>) =>
		pipe(
			Match.type<Options.objectPropertiesSortMethodType>(),
			Match.when('byName', () => Chunk.sort(Property.byKey)(self)),
			Match.when('byPrefixedName', () =>
				Chunk.sort(Property.byPrefixedKey)(self)
			),
			Match.when('byLevelAndName', () =>
				Chunk.sort(Property.byLevelAndKey)(self)
			),
			Match.when('noSorting', () => self),
			Match.exhaustive
		)(options.propertiesSortMethod);
