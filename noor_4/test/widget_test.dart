import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:noor/core/theme.dart';

void main() {
  test('Noor uses a dark theme', () {
    final theme = NoorTheme.dark();
    expect(theme.brightness, Brightness.dark);
    expect(theme.scaffoldBackgroundColor, NoorTheme.background);
  });
}
