import * as FormattedString from "#mjljm/effect-pretty-print/FormattedString";
import * as Property from "#mjljm/effect-pretty-print/Property";
import { MFunction, MMatch, MString } from "@mjljm/effect-lib";
import { JsANSI } from "@mjljm/js-lib";
import { Match, Option, ReadonlyArray, String, pipe } from "effect";

export const _ = (s: string, f?: (i: string) => string) =>
  f === undefined
    ? FormattedString.makeFromUnformattedString(s)
    : FormattedString.makeWithZeroLengthFormatFunction(s, f);

export type stringOrSymbolPropertiesType = "string" | "symbol" | "both";
export type enumerableOrNonEnumarablePropertiesType =
  | "enumerable"
  | "nonEnumerable"
  | "both";

export interface ComplexTypeFormat {
  /**
   * String to use as mark for array/object start.
   */
  readonly startMark: FormattedString.Type;
  /**
   * String to use as mark for array/object end.
   */
  readonly endMark: FormattedString.Type;
  /**
   * String to use as separator between values when displaying an array/object.
   */
  readonly separator: FormattedString.Type;
}

export interface ArrayFormat extends ComplexTypeFormat {}
export const ArrayFormat = MFunction.make<ArrayFormat>;

export interface ObjectFormat extends ComplexTypeFormat {
  /**
   * String to use as separator between key and value when displaying an object.
   */
  readonly propertySeparator: FormattedString.Type;
}
export const ObjectFormat = MFunction.make<ObjectFormat>;

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
   * Default: false
   */
  readonly showPrototype?: boolean;
  /**
   * Whether to sort object properties.
   * Default: true
   */
  readonly sortObjectProperties?: boolean;
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
   * Strings to use to format an object.
   * Default: ['{','}',',',': ']
   */
  readonly objectFormat?: ObjectFormat;
  /**
   * Strings to use to format an array.
   * Default: ['[',']',',']
   */
  readonly arrayFormat?: ArrayFormat;
  /**
   * Any object or array shorter than `noLineBreakIfShorterThan` will be printed on a single line without tabs. If inferior or equal to 0, objects and arrays, even empty, are always split on multiple lines.
   * Default: 40
   */
  readonly noLineBreakIfShorterThan?: number;
  /**
   * Function used to determine if a property must be displayed or not. If the function returns a none, the property is shown if it satisfies the `stringOrSymbolProperties`, `enumerableOrNonEnumarableProperties` and `showFunctions` options. If it returns a some, the `stringOrSymbolProperties`, `enumerableOrNonEnumarableProperties` and `showFunctions` options are ignored and the content of the some determines if the property is displayed.
   * Default: ()=>Option.none()
   */
  readonly propertyFilter?: (property: Property.Type) => Option.Option<boolean>;
  /**
   * Function used to format the keys of an object, e.g add color or modify the way symbols are displayed. If `showPrototype` is set, this function will receive a '[[Prototpe]]' key.
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
  readonly formatter?: (
    value: MFunction.Unknown,
  ) => Option.Option<FormattedString.Type>;
}

export const make = MFunction.make<Type>;
export const makeAllRequired = MFunction.make<Required<Type>>;

export const basicKeyFormatter = (key: symbol | string): FormattedString.Type =>
  pipe(
    Match.type<string | symbol>(),
    Match.when(Match.symbol, (sym) => _(sym.toString())),
    Match.when(Match.string, (s) => _(s)),
    Match.exhaustive,
  )(key);

export const basicFormatter = (
  value: unknown,
): Option.Option<FormattedString.Type> =>
  pipe(
    Match.type<MFunction.Unknown>(),
    Match.when(MMatch.primitive, () => Option.none()),
    Match.when(MMatch.function, () => Option.none()),
    Match.when(MMatch.array, () => Option.none()),
    Match.when(Match.record, (obj) =>
      Option.map(MString.tryToStringToJson(obj), (s) => _(s)),
    ),
    Match.exhaustive,
  )(value as MFunction.Unknown);

export const basic = makeAllRequired({
  stringOrSymbolProperties: "string",
  enumerableOrNonEnumarableProperties: "enumerable",
  showFunctions: false,
  showPrototype: false,
  sortObjectProperties: true,
  tab: _("  "),
  initialTab: _(""),
  linebreak: _("\n"),
  objectFormat: ObjectFormat({
    startMark: _("{"),
    endMark: _("}"),
    separator: _(","),
    propertySeparator: _(":"),
  }),
  arrayFormat: ArrayFormat({
    startMark: _("["),
    endMark: _("]"),
    separator: _(","),
  }),
  noLineBreakIfShorterThan: 40,
  propertyFilter: () => Option.none(),
  keyFormatter: basicKeyFormatter,
  formatter: basicFormatter,
});

export const ansiKeyFormatter = (key: symbol | string): FormattedString.Type =>
  pipe(
    Match.type<symbol | string>(),
    Match.when(Match.symbol, (sym) =>
      pipe(
        sym.toString(),
        String.match(/^Symbol\((.*)\)$/),
        Option.flatMap(ReadonlyArray.get(0)),
        Option.map((s) => _(s, JsANSI.magenta)),
        Option.getOrElse(() =>
          _(
            "Symbol.prototype.toString should output in format 'Symbol(x)'",
            JsANSI.red,
          ),
        ),
      ),
    ),
    Match.when(Match.string, (s) => _(s, JsANSI.black)),
    Match.exhaustive,
  )(key);

export const ansiFormatter = (
  value: unknown,
): Option.Option<FormattedString.Type> =>
  pipe(
    Match.type<MFunction.Unknown>(),
    Match.when(Match.string, (s) => Option.some(_(s, JsANSI.blue))),
    Match.when(Match.number, (n) => Option.some(_(n.toString(), JsANSI.black))),
    Match.when(Match.bigint, (n) => Option.some(_(n.toString(), JsANSI.black))),
    Match.when(Match.boolean, (b) => Option.some(_(b.toString(), JsANSI.cyan))),
    Match.when(Match.symbol, (s) =>
      Option.some(_(s.toString(), JsANSI.magenta)),
    ),
    Match.when(Match.undefined, () => Option.some(_("undefined", JsANSI.cyan))),
    Match.when(Match.null, () => Option.some(_("null", JsANSI.cyan))),
    Match.when(MMatch.function, () =>
      Option.some(_("Function()", JsANSI.cyan)),
    ),
    Match.when(MMatch.array, () => Option.none()),
    Match.when(Match.record, (obj) =>
      Option.map(MString.tryToStringToJson(obj), (s) => _(s)),
    ),
    Match.exhaustive,
  )(value as MFunction.Unknown);

export const ansi = make({
  objectFormat: ObjectFormat({
    startMark: _("{", JsANSI.green),
    endMark: _("}", JsANSI.green),
    separator: _(",", JsANSI.green),
    propertySeparator: _(": ", JsANSI.green),
  }),
  arrayFormat: ArrayFormat({
    startMark: _("[", JsANSI.green),
    endMark: _("]", JsANSI.green),
    separator: _(",", JsANSI.green),
  }),
  keyFormatter: ansiKeyFormatter,
  formatter: ansiFormatter,
});
