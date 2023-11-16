import * as MFunction from '@mjljm/effect-lib/effect/Function';
import * as MStruct from '@mjljm/effect-lib/effect/Struct';
import * as FormattedString from '@mjljm/effect-pretty-print/FormattedString';
import * as Property from '@mjljm/effect-pretty-print/Property';
import { Option, Order } from 'effect';

export type stringOrSymbolPropertiesType = 'string' | 'symbol' | 'both';
export type enumerableOrNonEnumarablePropertiesType = 'enumerable' | 'nonEnumerable' | 'both';
export type objectPropertiesSortMethodType =
	| 'byName'
	| 'byPrefixedName'
	| 'byLevelAndName'
	| 'noSorting';

export interface Options {
	/**
	 * Whether to show string or symbol properties of objects, or both.
	 * Default: 'string'
	 */
	readonly stringOrSymbolProperties?: stringOrSymbolPropertiesType;
	/**
	 * Whether to show enumerable or non-enumerable properties of objects, or both.
	 * Default: 'enumerable'
	 */
	readonly enumerableOrNonEnumarableProperties?: enumerableOrNonEnumarablePropertiesType;
	/**
	 * Whether to show properties representing functions.
	 * Default: false
	 */
	readonly showFunctions?: boolean;
	/**
	 * Whether to show inherited properties of the prototype chain.
	 * Default: false
	 */
	readonly showInherited?: boolean;
	/**
	 * How to sort objet properties. Possible values are:
	 * - byName: all properties (own and inherited if showInherited is true) are sorted alphabetically on propertie's formatted name, that is the name of the property as it results from the propertyFormatter function
	 * - byPrefixedName: all properties (own and inherited if showInherited is true) are sorted alphabetically on propertie's prefixed formatted name. See `prototypePrefix` option for more information.
	 * - byLevelAndName: first own properties sorted alphabetically, then prototype's properties sorted alphabetically, then...
	 * - noSorting: first own properties in the order they are provided by Reflect.ownKeys, then prototype's properties in the order they are provided by Reflect.ownKeys, then...
	 * Default: noSorting
	 */
	readonly propertiesSortMethod?: objectPropertiesSortMethodType;
	/**
	 * Order to use to sort object properties (only when sortObjectProperties === true)
	 * Default: string as defined in Effect Order
	 */
	readonly propertieSortOrder?: Order.Order<string>;
	/**
	 * String to use as tab applied to indent objects and arrays contents.
	 * Default: '  ' (two spaces)
	 */
	readonly tab?: FormattedString.FormattedString;
	/**
	 * Extra tab that is applied at the start of each new line.
	 * Default: ''
	 */
	readonly initialTab?: FormattedString.FormattedString;
	/**
	 * Character to use as linebreak.
	 * Default: '\n'
	 */
	readonly linebreak?: FormattedString.FormattedString;
	/**
	 * String to use as prefix for properties inherited from the prototype chain. This prefix will be repeated as many times as the depth of the property in the prototype chain
	 * Default: 'proto.'
	 */
	readonly prototypePrefix?: FormattedString.FormattedString;
	/**
	 * String to use as separator between key and value when displaying an object
	 * Default: ': '
	 */
	readonly propertySeparator?: FormattedString.FormattedString;
	/**
	 * String to use as mark for object start
	 * Default: '{'
	 */
	readonly objectStartMark?: FormattedString.FormattedString;
	/**
	 * String to use as mark for object end
	 * Default: '}'
	 */
	readonly objectEndMark?: FormattedString.FormattedString;
	/**
	 * String to use as separator between key/value pairs when displaying an object
	 * Default: ','
	 */
	readonly objectSeparator?: FormattedString.FormattedString;
	/**
	 * String to use as mark for array start
	 * Default: '['
	 */
	readonly arrayStartMark?: FormattedString.FormattedString;
	/**
	 * String to use as mark for array end
	 * Default: ']'
	 */
	readonly arrayEndMark?: FormattedString.FormattedString;
	/**
	 * String to use as separator between values when displaying an array
	 * Default: ','
	 */
	readonly arraySeparator?: FormattedString.FormattedString;
	/**
	 * Any object or array shorter than `noLineBreakIfShorterThan` will be printed on a single line without tabs. If inferior or equal to 0, objects and arrays, even empty, are always split on multiple lines.
	 * Default: 0
	 */
	readonly noLineBreakIfShorterThan?: number;
	/**
	 * Function used to determine if a property must be displayed or not. If the function returns a none, the property is shown if it satisfies the `stringOrSymbolProperties`, `enumerableOrNonEnumarableProperties` and `showFunctions` options. If it returns a some, the `stringOrSymbolProperties`, `enumerableOrNonEnumarableProperties` and `showFunctions` options are ignored and the content of the some determines if the property iis displayed. This option has no incidence on the `showInherited`option that is applied before it.
	 * Default: ()=>Option.none()
	 */
	readonly propertyPredicate?: (property: Property.Property) => Option.Option<boolean>;
	/**
	 * Function used to format the properties of an object, e.g add color or modify the way symbols are displayed.
	 * Default:
	 * 		(p: string | symbol) =>
	 *			pipe(
	 *				Match.type<string | symbol>(),
	 *				Match.when(Match.string, (v) => FormattedString.FormattedString.makeFromUnFormattedString.FormattedString(v.toString())),
	 *				Match.when(Match.symbol, (v) => FormattedString.FormattedString.makeFromUnFormattedString.FormattedString(v.toString())),
	 *				Match.exhaustive
	 *			)(p)
	 */
	readonly propertyKeyFormatter?: (key: symbol | string) => FormattedString.FormattedString;
	/**
	 * Function used to taylor the pretty print to your needs, e.g change the number of decimals for numbers, change how symbols are printed, add colors, define a special treatment for specific objects...
	 * Default: a function that calls the toString method on objects that define one different from Object.prototype.toString. This default function is exported under the name defaultFormatter if you want to call iy and modify its output.
	 */
	readonly formatter?: (value: MFunction.Unknown) => Option.Option<FormattedString.FormattedString>;
}

export const make = MStruct.make<Options>;
export const makeAllRequired = MStruct.make<Required<Options>>;
