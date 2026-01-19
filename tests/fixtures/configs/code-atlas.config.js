export default {
  dir: './src',
  output: 'docs.md',
  ignore: ['**/*.test.ts'],
  header: '# Documentation\n\nGenerated on ' + new Date().toISOString().split('T')[0] + '\n\n'
};
