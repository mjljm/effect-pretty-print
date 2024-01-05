import * as Options from '#mjljm/effect-pretty-print/Options';
import * as Property from '#mjljm/effect-pretty-print/Property';
import { MFunction } from '@mjljm/effect-lib';
import { Function, Match, Option, ReadonlyArray, pipe } from 'effect';

export type Type = ReadonlyArray<Property.Type>;

export const fromArray = (input: MFunction.Array): Array<Property.Type> =>
	pipe(
		input,
		ReadonlyArray.map((value) => Property.makeFromValue(Function.unsafeCoerce<unknown, MFunction.Unknown>(value)))
	);

export const fromRecord = (input: MFunction.Record, options: Required<Options.Type>): Array<Property.Type> =>
	pipe(
		input,
		Reflect.ownKeys,
		ReadonlyArray.filterMap((key) =>
			pipe(
				/*console.log(`key:${String(key)}`),*/
				Property.make({
					originalKey: key,
					key: options.keyFormatter(key),
					value: Function.unsafeCoerce<unknown, MFunction.Unknown>(input[key])
				}),
				Option.liftPredicate(keepProperty(input, options))
			)
		),
		MFunction.iif(
			() => options.showPrototype,
			ReadonlyArray.append(
				Property.make({
					originalKey: '[[Prototype]]',
					key: options.keyFormatter('[[Prototype]]'),
					value: Function.unsafeCoerce<unknown, MFunction.Unknown>(Object.getPrototypeOf(input))
				})
			)
		),
		// Sort if requested
		MFunction.iif(() => options.sortObjectProperties, ReadonlyArray.sort(Property.byKey))
	);

const keepProperty = (obj: MFunction.Record, options: Required<Options.Type>) => (property: Property.Type) =>
	Option.match(options.propertyFilter(property), {
		onNone: () =>
			(!MFunction.isFunction(property.value) || options.showFunctions) &&
			pipe(
				Match.type<Options.stringOrSymbolPropertiesType>(),
				Match.when('string', () => typeof property.originalKey === 'string'),
				Match.when('symbol', () => typeof property.originalKey === 'symbol'),
				Match.when('both', () => true),
				Match.exhaustive
			)(options.stringOrSymbolProperties) &&
			pipe(
				Match.type<Options.enumerableOrNonEnumarablePropertiesType>(),
				Match.when('enumerable', () => Object.prototype.propertyIsEnumerable.call(obj, property.originalKey)),
				Match.when('nonEnumerable', () => !Object.prototype.propertyIsEnumerable.call(obj, property.originalKey)),
				Match.when('both', () => true),
				Match.exhaustive
			)(options.enumerableOrNonEnumarableProperties),
		onSome: Function.identity
	});
