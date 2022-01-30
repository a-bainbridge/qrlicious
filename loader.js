  function u16(x){
    return new Uint16Array(x);
  }
  function u8(x){
    return new Uint8Array(x);
  }
  function u8from(x) {
    return Uint8Array.from(atob(x), c => c.charCodeAt(0));
  }
  function Tree() {
    return {
      table: u16(16),
      trans: u16(288)
    }
  }
  
  function Data(src, dest) {
    return {
      src,
      srcIndex: 0,
      tag: 0,
      bitcount: 0,
      dest,
      destLen: 0,
      ltree: Tree(),
      dtree: Tree()
    }
  }
  
  /* --------------------------------------------------- *
   * -- uninitialized global data (static structures) -- *
   * --------------------------------------------------- */
  
  /* extra bits and base tables for length codes */
  var length_bits = u8(30);
  var length_base = u16(30);
  
  /* extra bits and base tables for distance codes */
  var dist_bits = u8(30);
  var dist_base = u16(30);
  
  /* special ordering of code length codes */
  var clcidx = u8from("EBESAAgHCQYKBQsEDAMNAg4BDw==");
  
  /* used by tinf_decode_trees, avoids allocations every call */
  var code_tree = Tree();
  var lengths = u8(288 + 32);
  
  /* ----------------------- *
   * -- utility functions -- *
   * ----------------------- */
  
  /* build extra bits and base tables */
  function tinf_build_bits_base(bits, base, delta, first) {  
    /* build bits table */
    for (i = 0; i < delta;) bits[i++] = 0;
    for (i = 0; i < 30 - delta;) bits[i + delta] = i++ / delta | 0;
  
    /* build base table */
    for (sum = first, i = 0; i < 30;) {
      base[i] = sum;
      sum += 1 << bits[i++];
    }
  }
  
  /* given an array of code lengths, build a tree */
  var offs = u16(16);
  
  function tinf_build_tree(t, lengths, off, num) {  
    /* clear code length count table */
    for (i = 0; i < 16;) t.table[i++] = 0;
  
    /* scan symbol lengths, and sum code length counts */
    for (i = 0; i < num;) t.table[lengths[off + i++]]++;
  
    t.table[0] = 0;
  
    /* compute offset table for distribution sort */
    for (sum = 0, i = 0; i < 16;) {
      offs[i] = sum;
      sum += t.table[i++];
    }
  
    /* create code->symbol translation table (symbols sorted by code) */
    for (i = 0; i < num; ++i) {
      if (lengths[off + i])
      t.trans[offs[lengths[off + i]]++] = i;
    }
  }
  
  /* ---------------------- *
   * -- decode functions -- *
   * ---------------------- */
  
  /* get one bit from src stream */
  function tinf_getbit(d) {
    /* check if tag is empty */
    if (!d.bitcount--) {
      /* load next tag */
      d.tag = d.src[d.srcIndex++];
      d.bitcount = 7;
    }
    return (d.tag >>>= 1) & 1;
  }
  
  /* read a num bit value from a stream and add base */
  function tinf_read_bits(d, num, base) {
    if (!num)
      return base;
  
    while (d.bitcount < 24) {
      d.tag |= d.src[d.srcIndex++] << d.bitcount;
      d.bitcount += 8;
    }
  
    var val = d.tag & (0xffff >>> (16 - num));
    d.tag >>>= num;
    d.bitcount -= num;
    return val + base;
  }
  
  /* given a data stream and a tree, decode a symbol */
  function tinf_decode_symbol(d, t) {
    while (d.bitcount < 24) {
      d.tag |= d.src[d.srcIndex++] << d.bitcount;
      d.bitcount += 8;
    }
    
    var sum = cur = len = 0;
  
    /* get more bits while code value is above sum */
    do {
      cur = 2 * cur + (d.tag & 1);
      d.tag >>>= 1;
  
      sum += t.table[++len];
      cur -= t.table[len];
    } while (cur > -1);
    
    d.bitcount -= len;
  
    return t.trans[sum + cur];
  }
  
  /* given a data stream, decode dynamic trees from it */
  function tinf_decode_trees(d, lt, dt) {
    var hlit, hdist, hclen;
    var i, num, length;
  
    /* get 5 bits HLIT (257-286) */
    hlit = tinf_read_bits(d, 5, 257);
  
    /* get 5 bits HDIST (1-32) */
    hdist = tinf_read_bits(d, 5, 1);
  
    /* get 4 bits HCLEN (4-19) */
    hclen = tinf_read_bits(d, 4, 4);
  
    for (i = 0; i < 19;) lengths[i++] = 0;
  
    /* read code lengths for code length alphabet */
    for (i = 0; i < hclen;) {
      /* get 3 bits code length (0-7) */
      lengths[clcidx[i++]] = tinf_read_bits(d, 3, 0);
    }
  
    /* build code length tree */
    tinf_build_tree(code_tree, lengths, 0, 19);
  
    /* decode code lengths for the dynamic trees */
    for (num = 0; num < hlit + hdist;) {
      sym = tinf_decode_symbol(d, code_tree);
  
      sym2 = sym - 16;
      if( sym2 >= 0 ) {
        prev = [lengths[num - 1], 0, 0][sym2];
        for( length = tinf_read_bits(d, [2,3,7][sym2], [3,3,11][sym2]); length; --length ) {
          lengths[num++]=prev;
        }
      } else {
        lengths[num++] = sym;
      }
    }
  
    /* build dynamic trees */
    tinf_build_tree(lt, lengths, 0, hlit);
    tinf_build_tree(dt, lengths, hlit, hdist);
  }
  
  /* ----------------------------- *
   * -- block inflate functions -- *
   * ----------------------------- */
  
  /* given a stream and two trees, inflate a block of data */
  function tinf_inflate_block_data(d, lt, dt) {
    while (1) {
      sym = tinf_decode_symbol(d, lt);
  
      /* check for end of block */
      if (sym == 256) {
        return 0;
      }
  
      if (sym < 256) {
        d.dest[d.destLen++] = sym;
      } else {  
        sym -= 257;
  
        /* possibly get more bits from length code */
        length = tinf_read_bits(d, length_bits[sym], length_base[sym]);
  
        dist = tinf_decode_symbol(d, dt);
  
        /* possibly get more bits from distance code */
        offs = d.destLen - tinf_read_bits(d, dist_bits[dist], dist_base[dist]);
  
        /* copy match */
        for (i = offs; i < offs + length; ++i) {
          d.dest[d.destLen++] = d.dest[i];
        }
      }
    }
  }
  
  /* inflate stream from src to dest */
  function tinf_uncompress(src, dest) {
    d = Data(src, dest);
      /* read final block flag */
      bfinal = tinf_getbit(d);
  
      /* read block type (2 bits) */
      btype = tinf_read_bits(d, 2, 0);
      tinf_decode_trees(d, d.ltree, d.dtree);
      res = tinf_inflate_block_data(d, d.ltree, d.dtree);
    return d.dest;
  }
  
  /* -------------------- *
   * -- initialization -- *
   * -------------------- */
  
  /* build fixed huffman trees */
  
  /* build extra bits and base tables */
  tinf_build_bits_base(length_bits, length_base, 4, 3);
  tinf_build_bits_base(dist_bits, dist_base, 2, 1);
  
  /* fix a special case */
  length_bits[28] = 0;
  length_base[28] = 258;
  
  var compBuf = u8from('rVbfb9MwEH5H4n/wvBeQmqV9AJUujVS2DvEwOtZOsEcnuSQWThxipz9A/O+c82NL22SqBJEqx7777s6fv3PqnF0vrlaPd3MS60S4r185MbAAR4KPk4BmxI9ZrkBP6cPqxhrTPVusdWbBz4Kvp/S79TCzrmSSMc09AZT4MtWQIvDzfApBBPvQlCUwpWsOm0zmuuW94YGOpwGsuQ9WORkQnnLNmbCUzwRMRxfDp1iaawHu13vBfS4L5djVQm1Vevc0MY8ngx35/Tw3T8aCgKfRhAwv9w0hVmSFLOFiNyErFsuEDYhiqbIU5Dw88E5YHvEUo2Tby74ERyZP5gHkE5LKFFqmP8+vocyTo4qlQjokJgv5FoKjmFrL5Hg7HvN/RLks0mBCzsfjcV+VIyzzoNRWPTzNCo00gAAfR8E8EAOSDYhXYNr0sNTy/Cbkw7v1poevMWYbHxFTcq/4L8B6Lt5B0gMevcD2qIvurQlqzBXzFq50Zd4Aj2I9Ie+Hw24aqv0f7jbgKhMM1UKVxi7waTe4JO0Q60shUQnnYRh2o+LRIUTDVltM8AiZ8LF3ID9GOnbTA45dt7ZjuqDpkDPLCqUMFPIWgWU1y9VputeoS8euJ7UpHrk3i8X1EuONmjWj0labOdUOcXVKw5S6N5iBfMGGd+zS0natmeRB6VpfC6Yk40/d/R07MjPCJ2smCnSTOoacugszOHZlexnBCqVzpIxRd9a8nob0WcoChF2V42mYQiHgYTnr8MZzKTfeXvJynHWziPeeSY0S4aCIjfrL1yjjDj7LBiV6l2F+IxBaUmvwNbd+HeUO8mUVhfYcnVLUrV3IEnvx5GwIrJPVdRo03d9cG6kKL+GIrWlbVtNGXHZLXUavGchMwIFgA77eo7JXv42G72b3q0dyO7/9OL9va7k5ifavKeQ5yUuKR8H3aL2brSfVN4rvDsvMF3QWnR7XAOrILIK+Q95EyPS38r4jb4Sn3p4c3yDr+NV92ZcigjQwffqpHP/zHRDi9QIJ/i04rSUT6t52O7c68p9k+hcWUU/xUwkAAA==')
  var outputBuf = u8(1e5)
  tinf_uncompress(compBuf, outputBuf)
  document.write(new TextDecoder().decode(outputBuf))