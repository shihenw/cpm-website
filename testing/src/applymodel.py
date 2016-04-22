import cv2 as cv
import numpy as np
import math
import caffe
import subprocess
from matplotlib.pylab import cm

def checkparam(param):
    octave = param['octave']
    starting_range = param['starting_range']
    ending_range = param['ending_range']
    assert starting_range <= ending_range, 'starting ratio should <= ending ratio'
    assert octave >= 1, 'octave should >= 1'
    return starting_range, ending_range, octave


def applymodel(test_image, param, model):
    # prepare parameters
    starting_range, ending_range, octave = checkparam(param)
    boxsize = model['boxsize']
    oriImg = cv.imread(test_image)
    npart = model['np']

    starting_scale = boxsize/(oriImg.shape[0] * ending_range)
    ending_scale = boxsize/(oriImg.shape[0] * starting_range)
    multiplier = np.power(2, np.arange(math.log(starting_scale, 2), math.log(ending_scale, 2)+0.01, (float(1)/octave)))

    score = len(multiplier) * [None]
    peakValue = np.atleast_2d(np.zeros((len(multiplier), npart+1)))
    pad = len(multiplier) * [None]
    padded_size = len(multiplier) * [None]
    ori_size = len(multiplier) * [None]

    debug = 0

    for m in range(len(multiplier)):
        scale = multiplier[m]
        imageToTest = cv.resize(oriImg, (0,0), fx=scale, fy=scale, interpolation=cv.INTER_CUBIC)
        ori_size[m] = imageToTest.shape
        if debug:
            cv.imwrite('/home/shihenw/temp/scale_%d.png' % m, imageToTest)
        imageToTest, pad[m] = padRightDownCorner(imageToTest)
        if debug:
            cv.imwrite('/home/shihenw/temp/scale_%d_padded.png' % m, imageToTest)

        imageToTest = preprocess(imageToTest, 0.5)
        #caffe.reset()
        # modify deploy file
        command = "sed -i \"5s/.*/input_dim: %d/\" %s" % (imageToTest.shape[1], model['deployFile'])
        print command
        subprocess.call(command, shell=True)
        command = "sed -i \"6s/.*/input_dim: %d/\" %s" % (imageToTest.shape[0], model['deployFile'])
        subprocess.call(command, shell=True)

        caffe.set_mode_gpu()
        caffe.set_device(0)
        net = caffe.Net(model['deployFile'], model['caffemodel'], caffe.TEST)
        # set test batchsize
        data_blob_shape = net.blobs['data'].data.shape
        data_blob_shape = list(data_blob_shape) # from tuple to list
        net.blobs['data'].reshape(1, data_blob_shape[1], data_blob_shape[2], data_blob_shape[3])

        # load data, len(images) = batchsize
        imageToTest = imageToTest[:,:,:,None]
        #print imageToTest.shape
        net.blobs['data'].data[...] = np.transpose(imageToTest, (3,2,1,0))

        # process the data through network
        out = net.forward()
        #print out['Mconv6_third'].shape
        score[m] = np.squeeze(np.transpose(out['Mconv6_third'], (2,3,1,0))) # note we transpose here
        #print score[m].shape[2]

        if debug: 
            colormap = cm.jet_r
            for c in range(score[m].shape[2]):
                #print heatmap[:,:,0]
                print score[m][:,:,c].shape
                colorized = colormap(score[m][:,:,c])
                print colorized.shape
                cv.imwrite('/home/shihenw/temp/heatmap_%d.png' % (c+1), colorized[:,:,0:3]*256)

        score_to_plot = cv.resize(score[m], (0,0), fx=4, fy=4, interpolation=cv.INTER_CUBIC)

        for part in range(npart+1):
            peakValue[m][part] = np.ndarray.max(score_to_plot[:,:,part])

    # end for loop m

    # print "shape of peakValue is "
    # print peakValue.shape
    # print "shape of mean is "
    # print np.mean(peakValue[:,0:npart], axis=1)
    bestI = np.argmax(np.mean(peakValue[:,0:npart], axis=1))
    # print "bestI ",
    # print bestI
    # post-processing the heatmap
    #print "pad ",
    #print pad
    pad = pad[bestI]
    score = cv.resize(score[bestI], (0,0), fx=4, fy=4, interpolation=cv.INTER_CUBIC)
    #print score.shape
    #print pad

    # make heatmaps into the size of scaled image according to pad
    score = resizeIntoScaledImg(score, pad)
    #print "after resizeIntoScaledImg"
    #print score.shape
    #print ori_size
    #print oriImg.shape
    #print "going to do..."
    score = cv.resize(score, (oriImg.shape[1], oriImg.shape[0]), interpolation=cv.INTER_CUBIC)
    #cv.imwrite('/home/shihenw/temp/heatmap_0.png', score[:,:,14]*256)
    #print score.shape
    #print oriImg.shape
    
    # DEBUG: visualize to make sure heat maps are correctly superimposed on image
    #colormap = cm.jet_r
    #colorized = colormap(score[:,:,0])
    #img_superimposed = (colorized[:,:,0:3] * 255 + oriImg)/2
    #cv.imwrite('/home/shihenw/temp/debug_0.png', img_superimposed)

    # generate prediction
    prediction = np.zeros((npart,2))
    for j in range(npart):
        prediction[j][0], prediction[j][1] = findMaximum(score[:,:,j])
    #print prediction

    return score, prediction

def findMaximum(map):
    return np.unravel_index(np.argmax(map), map.shape)

def resizeIntoScaledImg(score, pad): #return score
    npart = score.shape[2]-1
    if pad[0] < 0:
        z = np.zeros((-pad[0], score.shape[1], npart))
        o = np.ones((-pad[0], score.shape[1], 1))
        padup = np.concatenate(z, o, axis=2)
        score = np.concatenate(padup, score, axis=0) # pad up
    else:
        score = np.delete(score, range(pad[0]), axis=0) # crop up

    if pad[1] < 0:
        z = np.zeros((score.shape[0], -pad[1], npart))
        o = np.ones((score.shape[0], -pad[1], 1))
        padleft = np.concatenate(z, o, axis=2)
        score = np.concatenate(padleft, score, axis=1) # pad left
    else:
        score = np.delete(score, range(pad[1]), axis=1) # crop left

    if pad[2] < 0:
        z = np.zeros((-pad[2], score.shape[1], npart))
        o = np.ones((-pad[2], score.shape[1], 1))
        paddown = np.concatenate(z, o, axis=2)
        score = np.concatenate(score, paddown, axis=0) # pad down
    else:
        score = np.delete(score, range(score.shape[0]-pad[2], score.shape[0]), axis=0) # crop down

    if pad[3] < 0:
        z = np.zeros((score.shape[0], -pad[3], npart))
        o = np.ones((score.shape[0], -pad[3], 1))
        padright = np.concatenate(z, o, axis=2)
        score = np.concatenate(score, padright, axis=1) # pad right
    else:
        score = np.delete(score, range(score.shape[1]-pad[3], score.shape[1]), axis=1) # crop right
    
    return score 

def padRightDownCorner(img):
    h = img.shape[0]
    w = img.shape[1]

    pad = 4 * [None]
    pad[0] = 76 # up
    pad[1] = 76 # left
    pad[2] = 76 + 8 - ((152+h) % 8) # down
    pad[3] = 76 + 8 - ((152+w) % 8) # right

    img_padded = img
    pad_up = np.tile(img_padded[0:1,:,:], (pad[0], 1, 1)) * 0
    img_padded = np.concatenate((pad_up, img_padded), axis=0)
    pad_left = np.tile(img_padded[:,0:1,:], (1, pad[1], 1)) * 0
    img_padded = np.concatenate((pad_left, img_padded), axis=1)
    pad_down = np.tile(img_padded[-2:-1,:,:], (pad[2], 1, 1)) * 0
    img_padded = np.concatenate((img_padded, pad_down), axis=0)
    pad_right = np.tile(img_padded[:,-2:-1,:], (1, pad[3], 1)) * 0
    img_padded = np.concatenate((img_padded, pad_right), axis=1)

    return img_padded, pad


def preprocess(img, mean):
    im_eq = np.float32(img)/256
    img_out = im_eq - mean
    img_out = np.transpose(img_out, (1,0,2))
    return img_out
