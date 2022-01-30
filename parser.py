import base64
import html.parser

def get_huffman_coding_for(tree, entry):
    return tree[0][entry]

class HuffmanEncoder(html.parser.HTMLParser):
    def __init__(self, tag_tbl, attr_key_tbl, attr_val_tbl, data_tbl):
        super().__init__()
        self.tag_tbl = tag_tbl
        self.attr_key_tbl = attr_key_tbl
        self.attr_val_tbl = attr_val_tbl
        self.data_tbl = data_tbl
        self.buffer = ''
    def handle_starttag(self, tag, attrs):
        print("Encountered a start tag:", tag)
        self.buffer = self.buffer + get_huffman_coding_for(self.tag_tbl, tag)
        if attrs == []:
            self.buffer = self.buffer + get_huffman_coding_for(self.attr_key_tbl, 'term')
        else:
            for attr in attrs:
                self.buffer = self.buffer + get_huffman_coding_for(self.attr_key_tbl, attr[0])
                self.buffer = self.buffer + get_huffman_coding_for(self.attr_val_tbl, attr[1])
            self.buffer = self.buffer + get_huffman_coding_for(self.attr_key_tbl, 'term')
        

    def handle_endtag(self, tag):
        print("Encountered an end tag :", tag)
        self.buffer = self.buffer + get_huffman_coding_for(self.tag_tbl, 'term')

    def handle_data(self, data):
        if data.strip() == '':
            return
        print("Encountered some data  :", data)
        self.buffer = self.buffer + get_huffman_coding_for(self.data_tbl, data)

class HTMLTableBuilder(html.parser.HTMLParser):
    tags = []
    last = None
    attr_keys = []
    attr_values = []
    def handle_starttag(self, tag, attrs):
        print("Encountered a start tag:", tag)
        self.last = {'tag': tag, 'attrs': attrs, 'data': None}
        self.tags.append(self.last)
        if attrs == []:
            self.attr_keys.append({'attr': None})
        else: 
            for attr in attrs:
                print(attr)
                self.attr_keys.append({'attr': attr[0]})
                self.attr_values.append({'attr': attr[1]})

    def handle_endtag(self, tag):
        print("Encountered an end tag :", tag)
        self.tags.append({'tag': 'term', 'attrs': None, 'data': None})

    def handle_data(self, data):
        if data.strip() == '':
            return
        print("Encountered some data  :", data)
        if data.startswith('@@'):
            print("Data contains @@, you better know what you're doing")
        self.last['data'] = data
    
    def calculate_frequencies(self, data, attribute='tag', inplace=False, inplace_val='data', none_state=None, none_symbol='term', tuple_slot=0):
        tag_freq = {}
        tag_data = {}
        sum = 0
        inplace_data = []

        def is_terminal(tag):
            return (none_state is None and tag is None) or none_state == tag

        def name_for(tag):
            acc = tag[attribute]
            if is_terminal(acc):
                acc = none_symbol
            if type(acc) is tuple:
                acc = acc[tuple_slot]
            return acc

        for tag in data:
            sum += 1
            acc = name_for(tag)
            if acc in tag_freq.keys():
                tag_freq[acc] += 1
            else:
                tag_freq[acc] = 1
                if inplace and not is_terminal(acc):
                    if inplace_val is None:
                      tag_data[acc] = acc
                    elif hasattr(tag, inplace_val):
                      tag_data[acc] = tag[inplace_val]
        if inplace:
            tag_freq_cpy = {}
            for tag, freq in tag_freq.items():
                if freq > 1:
                    tag_freq_cpy[tag] = freq
                    continue
                if tag not in tag_data.keys():
                    continue
                if '@@inplace' not in tag_freq_cpy.keys():
                    tag_freq_cpy['@@inplace'] = 0
                tag_freq_cpy['@@inplace'] += 1
                if inplace_val is None:
                    inplace_data.append(tag_data[tag])
                else:
                    inplace_data.append(tag_data[tag][inplace_val]) 
            tag_freq = tag_freq_cpy
        if sum == 0:
            return {}
        for tag in tag_freq.keys():
            tag_freq[tag] /= sum
        if inplace:
            return tag_freq, inplace_data
        return tag_freq
    def build_huffman(self, frequencies):
        tag_frequencies = frequencies
        tag_codes = {}
        if len(frequencies) == 1:
            for f in frequencies.keys():
                return {f: '0'}, 1 # todo can we get rid of this bit?
        while True:
            lowest_freq_1 = 1.0
            lowest_freq_2 = 1.0
            lowest = None
            second = None
            for tag, freq in tag_frequencies.items():
                if freq < lowest_freq_1 and freq < lowest_freq_2:
                    lowest_freq_2 = lowest_freq_1
                    second = lowest
                    lowest_freq_1 = freq
                    lowest = tag
                elif freq < lowest_freq_2:
                    lowest_freq_2 = freq
                    second = tag
            
            
            tag_frequencies[(lowest, second)] = lowest_freq_1 + lowest_freq_2

            del tag_frequencies[lowest]
            del tag_frequencies[second]
            if abs((lowest_freq_1 + lowest_freq_2) - 1.0) < 0.0001:
                break
        for ans in tag_frequencies.keys():
            max_depth = 0
            def code(n, p):
                if type(n) is tuple:
                    return max(code(n[0], p+'0'), code(n[1], p+'1'))
                else:
                    tag_codes[n] = p
                    return len(p)
            max_depth = code(ans, '')
            return tag_codes, max_depth
    def serialize_huffman(self, table):
        buf = bytearray()
        buf.append(len(table[0].keys()) & 0xFF)
        for entry in table[0].keys():
            buf = buf + bytes(entry, 'utf-8') + b'\0'
        buf = buf + b'\0'
        for entry in table[0].values():
            buf.append((len(entry) & 0xFF))
            buf.append((int(entry, 2) & 0xFF))
        return buf
    
    def encode(self, data):
        freq_tags = self.calculate_frequencies(self.tags)
        # freq_attr_keys, attrs_keys_data = self.calculate_frequencies(self.attr_keys, 'attr', True, None)
        # freq_attr_values, attrs_values_data = self.calculate_frequencies(self.attr_values, 'attr', True, None, none_state={})
        # freq_data, data_data = self.calculate_frequencies(self.tags, 'data', True, None, None)
        freq_attr_keys = self.calculate_frequencies(self.attr_keys, 'attr', False, None)
        freq_attr_values= self.calculate_frequencies(self.attr_values, 'attr', False, None, none_state={})
        freq_data = self.calculate_frequencies(self.tags, 'data', False, None, None)
        tag_huffman = self.build_huffman(freq_tags)
        print(tag_huffman)
        attr_key_huffman = self.build_huffman(freq_attr_keys)
        print(attr_key_huffman)
        attr_val_huffman = self.build_huffman(freq_attr_values)
        print(attr_val_huffman)
        data_huffman = self.build_huffman(freq_data)
        print(data_huffman)
        output = self.serialize_huffman(tag_huffman)+self.serialize_huffman(attr_key_huffman)+self.serialize_huffman(attr_val_huffman)+self.serialize_huffman(data_huffman)
        print(len(base64.b64encode(output)))
        coder = HuffmanEncoder(tag_huffman, attr_key_huffman, attr_val_huffman, data_huffman)
        coder.feed(data)
        print(coder.buffer)
        

        

parser = HTMLTableBuilder()
bla = open('index.html', 'rb')
data = str(bla.read(4096), 'utf-8')
parser.feed(data)
parser.encode(data)
