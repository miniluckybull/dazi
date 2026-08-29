// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'assign.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

Assignment _$AssignmentFromJson(Map<String, dynamic> json) {
  return _Assignment.fromJson(json);
}

/// @nodoc
mixin _$Assignment {
  String get assignee => throw _privateConstructorUsedError;
  String get at => throw _privateConstructorUsedError;
  String get by => throw _privateConstructorUsedError;

  /// Serializes this Assignment to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of Assignment
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $AssignmentCopyWith<Assignment> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $AssignmentCopyWith<$Res> {
  factory $AssignmentCopyWith(
          Assignment value, $Res Function(Assignment) then) =
      _$AssignmentCopyWithImpl<$Res, Assignment>;
  @useResult
  $Res call({String assignee, String at, String by});
}

/// @nodoc
class _$AssignmentCopyWithImpl<$Res, $Val extends Assignment>
    implements $AssignmentCopyWith<$Res> {
  _$AssignmentCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of Assignment
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? assignee = null,
    Object? at = null,
    Object? by = null,
  }) {
    return _then(_value.copyWith(
      assignee: null == assignee
          ? _value.assignee
          : assignee // ignore: cast_nullable_to_non_nullable
              as String,
      at: null == at
          ? _value.at
          : at // ignore: cast_nullable_to_non_nullable
              as String,
      by: null == by
          ? _value.by
          : by // ignore: cast_nullable_to_non_nullable
              as String,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$AssignmentImplCopyWith<$Res>
    implements $AssignmentCopyWith<$Res> {
  factory _$$AssignmentImplCopyWith(
          _$AssignmentImpl value, $Res Function(_$AssignmentImpl) then) =
      __$$AssignmentImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({String assignee, String at, String by});
}

/// @nodoc
class __$$AssignmentImplCopyWithImpl<$Res>
    extends _$AssignmentCopyWithImpl<$Res, _$AssignmentImpl>
    implements _$$AssignmentImplCopyWith<$Res> {
  __$$AssignmentImplCopyWithImpl(
      _$AssignmentImpl _value, $Res Function(_$AssignmentImpl) _then)
      : super(_value, _then);

  /// Create a copy of Assignment
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? assignee = null,
    Object? at = null,
    Object? by = null,
  }) {
    return _then(_$AssignmentImpl(
      assignee: null == assignee
          ? _value.assignee
          : assignee // ignore: cast_nullable_to_non_nullable
              as String,
      at: null == at
          ? _value.at
          : at // ignore: cast_nullable_to_non_nullable
              as String,
      by: null == by
          ? _value.by
          : by // ignore: cast_nullable_to_non_nullable
              as String,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$AssignmentImpl implements _Assignment {
  const _$AssignmentImpl(
      {required this.assignee, required this.at, required this.by});

  factory _$AssignmentImpl.fromJson(Map<String, dynamic> json) =>
      _$$AssignmentImplFromJson(json);

  @override
  final String assignee;
  @override
  final String at;
  @override
  final String by;

  @override
  String toString() {
    return 'Assignment(assignee: $assignee, at: $at, by: $by)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$AssignmentImpl &&
            (identical(other.assignee, assignee) ||
                other.assignee == assignee) &&
            (identical(other.at, at) || other.at == at) &&
            (identical(other.by, by) || other.by == by));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, assignee, at, by);

  /// Create a copy of Assignment
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$AssignmentImplCopyWith<_$AssignmentImpl> get copyWith =>
      __$$AssignmentImplCopyWithImpl<_$AssignmentImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$AssignmentImplToJson(
      this,
    );
  }
}

abstract class _Assignment implements Assignment {
  const factory _Assignment(
      {required final String assignee,
      required final String at,
      required final String by}) = _$AssignmentImpl;

  factory _Assignment.fromJson(Map<String, dynamic> json) =
      _$AssignmentImpl.fromJson;

  @override
  String get assignee;
  @override
  String get at;
  @override
  String get by;

  /// Create a copy of Assignment
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$AssignmentImplCopyWith<_$AssignmentImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

AssignmentResp _$AssignmentRespFromJson(Map<String, dynamic> json) {
  return _AssignmentResp.fromJson(json);
}

/// @nodoc
mixin _$AssignmentResp {
  Assignment? get assignment => throw _privateConstructorUsedError;

  /// Serializes this AssignmentResp to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of AssignmentResp
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $AssignmentRespCopyWith<AssignmentResp> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $AssignmentRespCopyWith<$Res> {
  factory $AssignmentRespCopyWith(
          AssignmentResp value, $Res Function(AssignmentResp) then) =
      _$AssignmentRespCopyWithImpl<$Res, AssignmentResp>;
  @useResult
  $Res call({Assignment? assignment});

  $AssignmentCopyWith<$Res>? get assignment;
}

/// @nodoc
class _$AssignmentRespCopyWithImpl<$Res, $Val extends AssignmentResp>
    implements $AssignmentRespCopyWith<$Res> {
  _$AssignmentRespCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of AssignmentResp
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? assignment = freezed,
  }) {
    return _then(_value.copyWith(
      assignment: freezed == assignment
          ? _value.assignment
          : assignment // ignore: cast_nullable_to_non_nullable
              as Assignment?,
    ) as $Val);
  }

  /// Create a copy of AssignmentResp
  /// with the given fields replaced by the non-null parameter values.
  @override
  @pragma('vm:prefer-inline')
  $AssignmentCopyWith<$Res>? get assignment {
    if (_value.assignment == null) {
      return null;
    }

    return $AssignmentCopyWith<$Res>(_value.assignment!, (value) {
      return _then(_value.copyWith(assignment: value) as $Val);
    });
  }
}

/// @nodoc
abstract class _$$AssignmentRespImplCopyWith<$Res>
    implements $AssignmentRespCopyWith<$Res> {
  factory _$$AssignmentRespImplCopyWith(_$AssignmentRespImpl value,
          $Res Function(_$AssignmentRespImpl) then) =
      __$$AssignmentRespImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({Assignment? assignment});

  @override
  $AssignmentCopyWith<$Res>? get assignment;
}

/// @nodoc
class __$$AssignmentRespImplCopyWithImpl<$Res>
    extends _$AssignmentRespCopyWithImpl<$Res, _$AssignmentRespImpl>
    implements _$$AssignmentRespImplCopyWith<$Res> {
  __$$AssignmentRespImplCopyWithImpl(
      _$AssignmentRespImpl _value, $Res Function(_$AssignmentRespImpl) _then)
      : super(_value, _then);

  /// Create a copy of AssignmentResp
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? assignment = freezed,
  }) {
    return _then(_$AssignmentRespImpl(
      assignment: freezed == assignment
          ? _value.assignment
          : assignment // ignore: cast_nullable_to_non_nullable
              as Assignment?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$AssignmentRespImpl implements _AssignmentResp {
  const _$AssignmentRespImpl({this.assignment});

  factory _$AssignmentRespImpl.fromJson(Map<String, dynamic> json) =>
      _$$AssignmentRespImplFromJson(json);

  @override
  final Assignment? assignment;

  @override
  String toString() {
    return 'AssignmentResp(assignment: $assignment)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$AssignmentRespImpl &&
            (identical(other.assignment, assignment) ||
                other.assignment == assignment));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, assignment);

  /// Create a copy of AssignmentResp
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$AssignmentRespImplCopyWith<_$AssignmentRespImpl> get copyWith =>
      __$$AssignmentRespImplCopyWithImpl<_$AssignmentRespImpl>(
          this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$AssignmentRespImplToJson(
      this,
    );
  }
}

abstract class _AssignmentResp implements AssignmentResp {
  const factory _AssignmentResp({final Assignment? assignment}) =
      _$AssignmentRespImpl;

  factory _AssignmentResp.fromJson(Map<String, dynamic> json) =
      _$AssignmentRespImpl.fromJson;

  @override
  Assignment? get assignment;

  /// Create a copy of AssignmentResp
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$AssignmentRespImplCopyWith<_$AssignmentRespImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

AssignedItem _$AssignedItemFromJson(Map<String, dynamic> json) {
  return _AssignedItem.fromJson(json);
}

/// @nodoc
mixin _$AssignedItem {
  String get slug => throw _privateConstructorUsedError;
  String get name => throw _privateConstructorUsedError;
  Assignment get assignment => throw _privateConstructorUsedError;

  /// Serializes this AssignedItem to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of AssignedItem
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $AssignedItemCopyWith<AssignedItem> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $AssignedItemCopyWith<$Res> {
  factory $AssignedItemCopyWith(
          AssignedItem value, $Res Function(AssignedItem) then) =
      _$AssignedItemCopyWithImpl<$Res, AssignedItem>;
  @useResult
  $Res call({String slug, String name, Assignment assignment});

  $AssignmentCopyWith<$Res> get assignment;
}

/// @nodoc
class _$AssignedItemCopyWithImpl<$Res, $Val extends AssignedItem>
    implements $AssignedItemCopyWith<$Res> {
  _$AssignedItemCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of AssignedItem
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? slug = null,
    Object? name = null,
    Object? assignment = null,
  }) {
    return _then(_value.copyWith(
      slug: null == slug
          ? _value.slug
          : slug // ignore: cast_nullable_to_non_nullable
              as String,
      name: null == name
          ? _value.name
          : name // ignore: cast_nullable_to_non_nullable
              as String,
      assignment: null == assignment
          ? _value.assignment
          : assignment // ignore: cast_nullable_to_non_nullable
              as Assignment,
    ) as $Val);
  }

  /// Create a copy of AssignedItem
  /// with the given fields replaced by the non-null parameter values.
  @override
  @pragma('vm:prefer-inline')
  $AssignmentCopyWith<$Res> get assignment {
    return $AssignmentCopyWith<$Res>(_value.assignment, (value) {
      return _then(_value.copyWith(assignment: value) as $Val);
    });
  }
}

/// @nodoc
abstract class _$$AssignedItemImplCopyWith<$Res>
    implements $AssignedItemCopyWith<$Res> {
  factory _$$AssignedItemImplCopyWith(
          _$AssignedItemImpl value, $Res Function(_$AssignedItemImpl) then) =
      __$$AssignedItemImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({String slug, String name, Assignment assignment});

  @override
  $AssignmentCopyWith<$Res> get assignment;
}

/// @nodoc
class __$$AssignedItemImplCopyWithImpl<$Res>
    extends _$AssignedItemCopyWithImpl<$Res, _$AssignedItemImpl>
    implements _$$AssignedItemImplCopyWith<$Res> {
  __$$AssignedItemImplCopyWithImpl(
      _$AssignedItemImpl _value, $Res Function(_$AssignedItemImpl) _then)
      : super(_value, _then);

  /// Create a copy of AssignedItem
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? slug = null,
    Object? name = null,
    Object? assignment = null,
  }) {
    return _then(_$AssignedItemImpl(
      slug: null == slug
          ? _value.slug
          : slug // ignore: cast_nullable_to_non_nullable
              as String,
      name: null == name
          ? _value.name
          : name // ignore: cast_nullable_to_non_nullable
              as String,
      assignment: null == assignment
          ? _value.assignment
          : assignment // ignore: cast_nullable_to_non_nullable
              as Assignment,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$AssignedItemImpl implements _AssignedItem {
  const _$AssignedItemImpl(
      {required this.slug, required this.name, required this.assignment});

  factory _$AssignedItemImpl.fromJson(Map<String, dynamic> json) =>
      _$$AssignedItemImplFromJson(json);

  @override
  final String slug;
  @override
  final String name;
  @override
  final Assignment assignment;

  @override
  String toString() {
    return 'AssignedItem(slug: $slug, name: $name, assignment: $assignment)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$AssignedItemImpl &&
            (identical(other.slug, slug) || other.slug == slug) &&
            (identical(other.name, name) || other.name == name) &&
            (identical(other.assignment, assignment) ||
                other.assignment == assignment));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, slug, name, assignment);

  /// Create a copy of AssignedItem
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$AssignedItemImplCopyWith<_$AssignedItemImpl> get copyWith =>
      __$$AssignedItemImplCopyWithImpl<_$AssignedItemImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$AssignedItemImplToJson(
      this,
    );
  }
}

abstract class _AssignedItem implements AssignedItem {
  const factory _AssignedItem(
      {required final String slug,
      required final String name,
      required final Assignment assignment}) = _$AssignedItemImpl;

  factory _AssignedItem.fromJson(Map<String, dynamic> json) =
      _$AssignedItemImpl.fromJson;

  @override
  String get slug;
  @override
  String get name;
  @override
  Assignment get assignment;

  /// Create a copy of AssignedItem
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$AssignedItemImplCopyWith<_$AssignedItemImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

Comment _$CommentFromJson(Map<String, dynamic> json) {
  return _Comment.fromJson(json);
}

/// @nodoc
mixin _$Comment {
  String get at => throw _privateConstructorUsedError;
  String get by => throw _privateConstructorUsedError;
  String get text => throw _privateConstructorUsedError;
  List<String> get mentions => throw _privateConstructorUsedError;

  /// Serializes this Comment to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of Comment
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $CommentCopyWith<Comment> get copyWith => throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $CommentCopyWith<$Res> {
  factory $CommentCopyWith(Comment value, $Res Function(Comment) then) =
      _$CommentCopyWithImpl<$Res, Comment>;
  @useResult
  $Res call({String at, String by, String text, List<String> mentions});
}

/// @nodoc
class _$CommentCopyWithImpl<$Res, $Val extends Comment>
    implements $CommentCopyWith<$Res> {
  _$CommentCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of Comment
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? at = null,
    Object? by = null,
    Object? text = null,
    Object? mentions = null,
  }) {
    return _then(_value.copyWith(
      at: null == at
          ? _value.at
          : at // ignore: cast_nullable_to_non_nullable
              as String,
      by: null == by
          ? _value.by
          : by // ignore: cast_nullable_to_non_nullable
              as String,
      text: null == text
          ? _value.text
          : text // ignore: cast_nullable_to_non_nullable
              as String,
      mentions: null == mentions
          ? _value.mentions
          : mentions // ignore: cast_nullable_to_non_nullable
              as List<String>,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$CommentImplCopyWith<$Res> implements $CommentCopyWith<$Res> {
  factory _$$CommentImplCopyWith(
          _$CommentImpl value, $Res Function(_$CommentImpl) then) =
      __$$CommentImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({String at, String by, String text, List<String> mentions});
}

/// @nodoc
class __$$CommentImplCopyWithImpl<$Res>
    extends _$CommentCopyWithImpl<$Res, _$CommentImpl>
    implements _$$CommentImplCopyWith<$Res> {
  __$$CommentImplCopyWithImpl(
      _$CommentImpl _value, $Res Function(_$CommentImpl) _then)
      : super(_value, _then);

  /// Create a copy of Comment
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? at = null,
    Object? by = null,
    Object? text = null,
    Object? mentions = null,
  }) {
    return _then(_$CommentImpl(
      at: null == at
          ? _value.at
          : at // ignore: cast_nullable_to_non_nullable
              as String,
      by: null == by
          ? _value.by
          : by // ignore: cast_nullable_to_non_nullable
              as String,
      text: null == text
          ? _value.text
          : text // ignore: cast_nullable_to_non_nullable
              as String,
      mentions: null == mentions
          ? _value._mentions
          : mentions // ignore: cast_nullable_to_non_nullable
              as List<String>,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$CommentImpl implements _Comment {
  const _$CommentImpl(
      {required this.at,
      required this.by,
      required this.text,
      final List<String> mentions = const <String>[]})
      : _mentions = mentions;

  factory _$CommentImpl.fromJson(Map<String, dynamic> json) =>
      _$$CommentImplFromJson(json);

  @override
  final String at;
  @override
  final String by;
  @override
  final String text;
  final List<String> _mentions;
  @override
  @JsonKey()
  List<String> get mentions {
    if (_mentions is EqualUnmodifiableListView) return _mentions;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_mentions);
  }

  @override
  String toString() {
    return 'Comment(at: $at, by: $by, text: $text, mentions: $mentions)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$CommentImpl &&
            (identical(other.at, at) || other.at == at) &&
            (identical(other.by, by) || other.by == by) &&
            (identical(other.text, text) || other.text == text) &&
            const DeepCollectionEquality().equals(other._mentions, _mentions));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, at, by, text,
      const DeepCollectionEquality().hash(_mentions));

  /// Create a copy of Comment
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$CommentImplCopyWith<_$CommentImpl> get copyWith =>
      __$$CommentImplCopyWithImpl<_$CommentImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$CommentImplToJson(
      this,
    );
  }
}

abstract class _Comment implements Comment {
  const factory _Comment(
      {required final String at,
      required final String by,
      required final String text,
      final List<String> mentions}) = _$CommentImpl;

  factory _Comment.fromJson(Map<String, dynamic> json) = _$CommentImpl.fromJson;

  @override
  String get at;
  @override
  String get by;
  @override
  String get text;
  @override
  List<String> get mentions;

  /// Create a copy of Comment
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$CommentImplCopyWith<_$CommentImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
