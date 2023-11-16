import * as MFunction from "@mjljm/effect-lib/effect/Function";
import * as MMatch from "@mjljm/effect-lib/effect/Match";
import * as FormattedString from "@mjljm/effect-pretty-print/FormattedString";
import * as Options from "@mjljm/effect-pretty-print/Options";
import * as OptionsAndPrecalcs from "@mjljm/effect-pretty-print/OptionsAndPrecalcs";
import * as SplitObject from "@mjljm/effect-pretty-print/SplitObject";
import {
  HashSet,
  Match,
  MutableHashMap,
  Option,
  Order,
  ReadonlyArray,
  Tuple,
  pipe,
} from "effect";
import { isSymbol } from "effect/Predicate";
export { type Options } from "@mjljm/effect-pretty-print/Options";

export const _ = (s: string) => FormattedString.makeFromUnformattedString(s);
type ObjectCache = MutableHashMap.MutableHashMap<
  MFunction.RecordOrArray,
  FormattedString.FormattedString
>;

export const defaultFormatter = (
  value: unknown,
): Option.Option<FormattedString.FormattedString> =>
  pipe(
    Match.type<MFunction.Unknown>(),
    Match.when(MMatch.primitive, () => Option.none()),
    Match.when(MMatch.function, () => Option.none()),
    Match.when(MMatch.array, () => Option.none()),
    Match.when(Match.record, (obj) => {
      const toString = obj["toString"];
      if (
        typeof toString === "function" &&
        toString !== Object.prototype.toString
      ) {
        try {
          return Option.some(_(toString()));
        } catch (e) {
          return Option.none();
        }
      } else return Option.none();
    }),
    Match.exhaustive,
  )(value as MFunction.Unknown);

/**
 * Pretty prints an object.
 *
 * @param u The object to print
 *
 */
export const stringify = (u: unknown, options?: Options.Options) =>
  pipe(
    // Default options
    Options.makeAllRequired({
      stringOrSymbolProperties: "string",
      enumerableOrNonEnumarableProperties: "enumerable",
      showFunctions: false,
      showInherited: false,
      propertiesSortMethod: "noSorting",
      propertieSortOrder: Order.string,
      tab: _("  "),
      initialTab: _(""),
      linebreak: _("\n"),
      prototypePrefix: _("proto."),
      propertySeparator: _(": "),
      objectStartMark: _("{"),
      objectEndMark: _("}"),
      objectSeparator: _(","),
      arrayStartMark: _("["),
      arrayEndMark: _("]"),
      arraySeparator: _(","),
      noLineBreakIfShorterThan: 0,
      propertyPredicate: () => Option.none(),
      propertyKeyFormatter: (p: string | symbol) =>
        pipe(
          Match.type<string | symbol>(),
          Match.when(Match.string, (v) => _(v.toString())),
          Match.when(isSymbol, (v) => _(v.toString())),
          Match.exhaustive,
        )(p),
      formatter: defaultFormatter,
    }),
    // Merge with user's options
    (defaultOptions) =>
      Options.makeAllRequired({ ...defaultOptions, ...options }),
    // Add Precalcs
    (optionsWithDefaultValues) =>
      OptionsAndPrecalcs.make({
        ...optionsWithDefaultValues,
        objectMarksLength:
          optionsWithDefaultValues.objectStartMark.printedLength +
          optionsWithDefaultValues.objectEndMark.printedLength,
        arrayMarksLength:
          optionsWithDefaultValues.arrayStartMark.printedLength +
          optionsWithDefaultValues.arrayEndMark.printedLength,
      }),
    (optionsWithDefaultsAndPrecalcs) =>
      internalToString(
        u as MFunction.Unknown,
        MutableHashMap.empty<
          MFunction.RecordOrArray,
          FormattedString.FormattedString
        >(),
        HashSet.empty<MFunction.RecordOrArray>(),
        optionsWithDefaultsAndPrecalcs,
        optionsWithDefaultsAndPrecalcs.initialTab,
        0,
      ),
  );

const internalToString = (
  u: MFunction.Unknown,
  stringified: ObjectCache,
  parents: HashSet.HashSet<MFunction.RecordOrArray>,
  options: OptionsAndPrecalcs.OptionsAndPrecalcs,
  currentTab: FormattedString.FormattedString,
  depth: number,
): FormattedString.FormattedString =>
  pipe(
    MFunction.isRecordOrArray(u)
      ? MutableHashMap.get(stringified, u)
      : Option.none(),
    Option.orElse(() => options.formatter(u)),
    Option.getOrElse(() =>
      pipe(
        Match.type<MFunction.Unknown>(),
        Match.when(Match.string, (s) => _("'" + s + "'")),
        Match.when(Match.number, (n) => _(n.toString())),
        Match.when(Match.bigint, (n) => _(n.toString())),
        Match.when(Match.boolean, (b) => _(b.toString())),
        Match.when(Match.symbol, (s) => _(s.toString())),
        Match.when(Match.undefined, () => _("undefined")),
        Match.when(Match.null, () => _("null")),
        Match.when(MMatch.function, () => _("Function()")),
        Match.when(MMatch.recordOrArray, (obj) =>
          handleArrayOrObject(
            obj,
            stringified,
            parents,
            options,
            currentTab,
            depth,
          ),
        ),
        Match.exhaustive,
      )(u),
    ),
    (value) =>
      MFunction.isRecordOrArray(u)
        ? (MutableHashMap.set(stringified, u, value), value)
        : value,
  );

const handleArrayOrObject = (
  obj: MFunction.RecordOrArray,
  stringified: ObjectCache,
  parents: HashSet.HashSet<MFunction.RecordOrArray>,
  options: OptionsAndPrecalcs.OptionsAndPrecalcs,
  currentTab: FormattedString.FormattedString,
  depth: number,
) =>
  HashSet.has(parents, obj)
    ? _("Circular") //Obj is parent of himself...
    : pipe(SplitObject.makeFromArrayOrObjectRecord(obj, options), (split) =>
        pipe(
          Tuple.make(
            HashSet.add(parents, obj),
            FormattedString.append(options.tab)(currentTab),
            split.properties.length > 0 ? split.separator.printedLength : 0,
          ),
          ([newParents, newTab, sepLength]) =>
            pipe(
              split.properties,
              ReadonlyArray.mapAccum(0, (acc, property) =>
                pipe(
                  internalToString(
                    property.value,
                    stringified,
                    newParents,
                    options,
                    newTab,
                    depth + 1,
                  ),
                  (s) =>
                    Tuple.make(
                      acc +
                        property.prefixedKey.printedLength +
                        split.sepsLength +
                        s.printedLength,
                      s,
                    ),
                  (z) => z,
                ),
              ),
              ([length, values]) =>
                length - sepLength + split.marksLength <=
                options.noLineBreakIfShorterThan
                  ? SplitObject.stringify(
                      split,
                      values,
                      _(""),
                      currentTab,
                      _(""),
                      depth,
                    )
                  : SplitObject.stringify(
                      split,
                      values,
                      options.linebreak,
                      currentTab,
                      options.tab,
                      depth,
                    ),
            ),
        ),
      );
