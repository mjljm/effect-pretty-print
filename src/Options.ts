import * as FormattedString from '#mjljm/effect-pretty-print/FormattedString';
import * as Property from '#mjljm/effect-pretty-print/Property';
import { MFunction, MMatch, MString, MStruct } from '@mjljm/effect-lib';
import { ANSI } from '@mjljm/js-lib';
import { Match, Option, Order, ReadonlyArray, String, pipe } from 'effect';

export const _ = (s: string, f?: (i: string) => string) =>
	f === undefined
		? FormattedString.makeFromUnformattedString(s)
		: FormattedString.makeWithZeroLengthFormatFunction(s, f);

export type stringOrSymbolPropertiesType = 'string' | 'symbol' | 'both';
export type enumerableOrNonEnumarablePropertiesType = 'enumerable' | 'nonEnumerable' | 'both';
export type objectPropertiesSortMethodType = 'byName' | 'byPrefixedName' | 'byLevelAndName' | 'noSorting';

export interface Type {
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
	 * Default: true
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
	readonly tab?: FormattedString.Type;
	/**
	 * Extra tab that is applied at the start of each new line.
	 * Default: ''
	 */
	readonly initialTab?: FormattedString.Type;
	/**
	 * Character to use as linebreak.
	 * Default: '\n'
	 */
	readonly linebreak?: FormattedString.Type;
	/**
	 * String to use as prefix for properties inherited from the prototype chain. This prefix will be repeated as many times as the depth of the property in the prototype chain
	 * Default: 'proto.'
	 */
	readonly prototypePrefix?: FormattedString.Type;
	/**
	 * String to use as separator between key and value when displaying an object
	 * Default: ': '
	 */
	readonly objectPropertySeparator?: FormattedString.Type;
	/**
	 * String to use as mark for object start
	 * Default: '{'
	 */
	readonly objectStartMark?: FormattedString.Type;
	/**
	 * String to use as mark for object end
	 * Default: '}'
	 */
	readonly objectEndMark?: FormattedString.Type;
	/**
	 * String to use as separator between key/value pairs when displaying an object
	 * Default: ','
	 */
	readonly objectSeparator?: FormattedString.Type;
	/**
	 * String to use as mark for array start
	 * Default: '['
	 */
	readonly arrayStartMark?: FormattedString.Type;
	/**
	 * String to use as mark for array end
	 * Default: ']'
	 */
	readonly arrayEndMark?: FormattedString.Type;
	/**
	 * String to use as separator between values when displaying an array
	 * Default: ','
	 */
	readonly arraySeparator?: FormattedString.Type;
	/**
	 * Any object or array shorter than `noLineBreakIfShorterThan` will be printed on a single line without tabs. If inferior or equal to 0, objects and arrays, even empty, are always split on multiple lines.
	 * Default: 40
	 */
	readonly noLineBreakIfShorterThan?: number;
	/**
	 * Function used to determine if a property must be displayed or not. If the function returns a none, the property is shown if it satisfies the `stringOrSymbolProperties`, `enumerableOrNonEnumarableProperties` and `showFunctions` options. If it returns a some, the `stringOrSymbolProperties`, `enumerableOrNonEnumarableProperties` and `showFunctions` options are ignored and the content of the some determines if the property iis displayed. This option has no incidence on the `showInherited`option that is applied before it.
	 * Default: ()=>Option.none()
	 */
	readonly propertyPredicate?: (property: Property.Property) => Option.Option<boolean>;
	/**
	 * Function used to format the keys of an object, e.g add color or modify the way symbols are displayed.
	 * Default:
	 *	(key: symbol | string):FormattedString.Type =>
	 *			pipe(
	 *				Match.type<string | symbol>(),
	 *				Match.when(Match.symbol, (sym) => _(sym.toString())),
	 *				Match.when(Match.string, (s) => _(s)),
	 *				Match.exhaustive
	 *			)(key);
	 */
	readonly keyFormatter?: (key: symbol | string) => FormattedString.Type;
	/**
	 * Function used to taylor the pretty print to your needs, e.g change number or symbol format, add colors, define a special treatment for specific objects... If the function returns a some, the value of that some is used as is. If it returns a none, the normal display algorithm is used.
	 * Default: a function that returns a some of the result of calling the toString method on value provided it defines one different from Object.prototype.toString. If toString is not defined or not overloaded, it returns a some of the result of calling the toJson function on value provided it defines one. If toString and toJson are not defined, returns a none. This default function is exported under the name defaultFormatter if you want to call iy and modify its output.
	 */
	readonly formatter?: (value: MFunction.Unknown) => Option.Option<FormattedString.Type>;
}

export const make = MStruct.make<Type>;
export const makeAllRequired = MStruct.make<Required<Type>>;

export const basicKeyFormatter = (key: symbol | string): FormattedString.Type =>
	pipe(
		Match.type<string | symbol>(),
		Match.when(Match.symbol, (sym) => _(sym.toString())),
		Match.when(Match.string, (s) => _(s)),
		Match.exhaustive
	)(key);

export const basicFormatter = (value: unknown): Option.Option<FormattedString.Type> =>
	pipe(
		Match.type<MFunction.Unknown>(),
		Match.when(MMatch.primitive, () => Option.none()),
		Match.when(MMatch.function, () => Option.none()),
		Match.when(MMatch.array, () => Option.none()),
		Match.when(Match.record, (obj) => Option.map(MString.toString(obj), (s) => _(s))),
		Match.exhaustive
	)(value as MFunction.Unknown);

export const basic = makeAllRequired({
	stringOrSymbolProperties: 'string',
	enumerableOrNonEnumarableProperties: 'enumerable',
	showFunctions: false,
	showInherited: true,
	propertiesSortMethod: 'noSorting',
	propertieSortOrder: Order.string,
	tab: _('  '),
	initialTab: _(''),
	linebreak: _('\n'),
	prototypePrefix: _('proto.'),
	objectPropertySeparator: _(': '),
	objectStartMark: _('{'),
	objectEndMark: _('}'),
	objectSeparator: _(','),
	arrayStartMark: _('['),
	arrayEndMark: _(']'),
	arraySeparator: _(','),
	noLineBreakIfShorterThan: 40,
	propertyPredicate: () => Option.none(),
	keyFormatter: basicKeyFormatter,
	formatter: basicFormatter
});

export const ansiKeyFormatter = (key: symbol | string): FormattedString.Type =>
	pipe(
		Match.type<symbol | string>(),
		Match.when(Match.symbol, (sym) =>
			pipe(
				sym.toString(),
				String.match(/^Symbol\((.*)\)$/),
				Option.flatMap(ReadonlyArray.get(0)),
				Option.map((s) => _(s, ANSI.magenta)),
				Option.getOrElse(() => _("Symbol.prototype.toString should output in format 'Symbol(x)'", ANSI.red))
			)
		),
		Match.when(Match.string, (s) => _(s, ANSI.black)),
		Match.exhaustive
	)(key);

export const ansiFormatter = (value: unknown): Option.Option<FormattedString.Type> =>
	pipe(
		Match.type<MFunction.Unknown>(),
		Match.when(Match.string, (s) => Option.some(_(s, ANSI.blue))),
		Match.when(Match.number, (n) => Option.some(_(n.toString(), ANSI.black))),
		Match.when(Match.bigint, (n) => Option.some(_(n.toString(), ANSI.black))),
		Match.when(Match.boolean, (b) => Option.some(_(b.toString(), ANSI.cyan))),
		Match.when(Match.symbol, (s) => Option.some(_(s.toString(), ANSI.magenta))),
		Match.when(Match.undefined, () => Option.some(_('undefined', ANSI.cyan))),
		Match.when(Match.null, () => Option.some(_('null', ANSI.cyan))),
		Match.when(MMatch.function, () => Option.some(_('Function()', ANSI.cyan))),
		Match.when(MMatch.array, () => Option.none()),
		Match.when(Match.record, (obj) => Option.map(MString.toString(obj), (s) => _(s))),
		Match.exhaustive
	)(value as MFunction.Unknown);

export const ansi = make({
	initialTab: _('  '),
	objectStartMark: _('{', ANSI.green),
	objectEndMark: _('}', ANSI.green),
	objectPropertySeparator: _(': ', ANSI.green),
	objectSeparator: _(',', ANSI.green),
	arrayStartMark: _('[', ANSI.green),
	arrayEndMark: _(']', ANSI.green),
	arraySeparator: _(',', ANSI.green),
	keyFormatter: ansiKeyFormatter,
	formatter: ansiFormatter
});
