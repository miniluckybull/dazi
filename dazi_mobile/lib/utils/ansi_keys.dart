class AnsiKeys {
  AnsiKeys._();

  static const esc = '\x1b';
  static const tab = '\t';
  static const enter = '\r';
  static const backspace = '\x7f';

  static const arrowUp = '\x1b[A';
  static const arrowDown = '\x1b[B';
  static const arrowRight = '\x1b[C';
  static const arrowLeft = '\x1b[D';

  static const home = '\x1b[H';
  static const end = '\x1b[F';
  static const pageUp = '\x1b[5~';
  static const pageDown = '\x1b[6~';

  static String control(String letter) {
    final lower = letter.toLowerCase();
    if (lower.length != 1 || lower.codeUnitAt(0) < 97 || lower.codeUnitAt(0) > 122) {
      return '';
    }
    return String.fromCharCode(lower.codeUnitAt(0) - 96);
  }
}
